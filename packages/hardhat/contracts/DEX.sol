// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TWAPOracle.sol";

/**
 * @title DEX - Decentralized Exchange
 * @notice A constant-product AMM (Automated Market Maker) like Uniswap V2
 * @dev Implements x * y = k formula with 0.3% trading fee
 */
contract DEX is ReentrancyGuard {
    IERC20 public immutable token;
    TWAPOracle public immutable oracle;

    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;
    
    // Security and control variables
    bool public paused;
    address public owner;
    uint256 public constant MAX_SLIPPAGE_BPS = 500; // 5% max slippage
    uint256 public constant DEFAULT_DEADLINE_BUFFER = 300; // 5 minutes default
    
    // Oracle state
    bool public oracleInitialized;

    // Custom Errors
    error DexAlreadyInitialized();
    error TokenTransferFailed();
    error InvalidEthAmount();
    error InvalidTokenAmount();
    error InsufficientTokenBalance(uint256 available, uint256 required);
    error InsufficientTokenAllowance(uint256 available, uint256 required);
    error EthTransferFailed(address to, uint256 amount);
    error InsufficientLiquidity(uint256 available, uint256 required);
    error ZeroReserve();
    error DeadlineExpired();
    error InsufficientOutputAmount(uint256 output, uint256 minOutput);
    error MaxSlippageExceeded(uint256 slippage, uint256 maxSlippage);
    error EmergencyPauseEnabled();

    // Events
    event EthToTokenSwap(address swapper, uint256 tokenOutput, uint256 ethInput);
    event TokenToEthSwap(address swapper, uint256 tokensInput, uint256 ethOutput);
    event LiquidityProvided(address liquidityProvider, uint256 liquidityMinted, uint256 ethInput, uint256 tokensInput);
    event LiquidityRemoved(address liquidityRemover, uint256 liquidityAmount, uint256 tokenOutput, uint256 ethOutput);

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
        owner = msg.sender;
        paused = false;
        
        // Deploy oracle for ETH/token pair
        oracle = new TWAPOracle(address(0), tokenAddress);
    }

    // Modifiers
    modifier whenNotPaused() {
        if (paused) revert EmergencyPauseEnabled();
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier validDeadline(uint256 deadline) {
        if (block.timestamp > deadline) revert DeadlineExpired();
        _;
    }

    /**
     * @notice Initializes the DEX with initial liquidity. Can only be called once.
     */
    function init(uint256 tokens) public payable returns (uint256 initialLiquidity) {
        if (totalLiquidity != 0) revert DexAlreadyInitialized();

        initialLiquidity = address(this).balance;
        totalLiquidity = initialLiquidity;
        liquidity[msg.sender] = initialLiquidity;

        if (!token.transferFrom(msg.sender, address(this), tokens)) revert TokenTransferFailed();
        
        // Initialize oracle (temporarily disabled for deployment)
        // if (!oracleInitialized) {
        //     oracle.initialize(address(this).balance, token.balanceOf(address(this)));
        //     oracleInitialized = true;
        // }

        return initialLiquidity;
    }

    /**
     * @notice Constant product price formula with 0.3% fee.
     * @dev yOutput = (yReserves * xInput * 997) / (xReserves * 1000 + xInput * 997)
     */
    function price(uint256 xInput, uint256 xReserves, uint256 yReserves) public pure returns (uint256 yOutput) {
        uint256 xInputWithFee = xInput * 997;
        uint256 numerator = xInputWithFee * yReserves;
        uint256 denominator = (xReserves * 1000) + xInputWithFee;
        return numerator / denominator;
    }

    /**
     * @notice Swap ETH for tokens.
     */
    function ethToToken(uint256 amountOutMin, uint256 deadline) 
        public 
        payable 
        nonReentrant 
        whenNotPaused 
        validDeadline(deadline)
        returns (uint256 tokenOutput) 
    {
        if (msg.value == 0) revert InvalidEthAmount();

        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));

        // Prevent division by zero
        if (ethReserve == 0 || tokenReserve == 0) revert ZeroReserve();

        tokenOutput = price(msg.value, ethReserve, tokenReserve);

        if (tokenOutput < amountOutMin) {
            revert InsufficientOutputAmount(tokenOutput, amountOutMin);
        }
        
        if (!token.transfer(msg.sender, tokenOutput)) revert TokenTransferFailed();
        
        // Update oracle after swap
        if (oracleInitialized) {
            oracle.update(address(this).balance, token.balanceOf(address(this)));
        }

        emit EthToTokenSwap(msg.sender, tokenOutput, msg.value);
        return tokenOutput;
    }

    /**
     * @notice Swap tokens for ETH.
     * @param tokenInput Amount of tokens to swap
     */
    function tokenToEth(uint256 tokenInput, uint256 amountOutMin, uint256 deadline) 
        public 
        nonReentrant 
        whenNotPaused 
        validDeadline(deadline)
        returns (uint256 ethOutput) 
    {
        if (tokenInput == 0) revert InvalidTokenAmount();

        uint256 bal = token.balanceOf(msg.sender);
        if (bal < tokenInput) revert InsufficientTokenBalance(bal, tokenInput);

        uint256 allow = token.allowance(msg.sender, address(this));
        if (allow < tokenInput) revert InsufficientTokenAllowance(allow, tokenInput);

        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 ethReserve = address(this).balance;

        // Prevent division by zero
        if (tokenReserve == 0 || ethReserve == 0) revert ZeroReserve();

        ethOutput = price(tokenInput, tokenReserve, ethReserve);

        if (ethOutput < amountOutMin) {
            revert InsufficientOutputAmount(ethOutput, amountOutMin);
        }
        
        if (!token.transferFrom(msg.sender, address(this), tokenInput)) revert TokenTransferFailed();

        (bool sent, ) = msg.sender.call{ value: ethOutput }("");
        if (!sent) revert EthTransferFailed(msg.sender, ethOutput);
        
        // Update oracle after swap
        if (oracleInitialized) {
            oracle.update(address(this).balance, token.balanceOf(address(this)));
        }

        emit TokenToEthSwap(msg.sender, tokenInput, ethOutput);
        return ethOutput;
    }

    /**
     * @notice Add liquidity proportionally. Mints LP shares to sender.
     */
    function deposit(uint256 amountTokenMin, uint256 deadline) 
        public 
        payable 
        nonReentrant 
        whenNotPaused 
        validDeadline(deadline)
        returns (uint256 tokensDeposited) 
    {
        if (msg.value == 0) revert InvalidEthAmount();

        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));

        // Prevent division by zero
        if (ethReserve == 0) revert ZeroReserve();

        // Handle first deposit when tokenReserve is 0
        if (tokenReserve == 0) {
            tokensDeposited = msg.value;
        } else {
            tokensDeposited = ((msg.value * tokenReserve) / ethReserve) + 1;
        }

        uint256 bal = token.balanceOf(msg.sender);
        if (bal < tokensDeposited) revert InsufficientTokenBalance(bal, tokensDeposited);

        uint256 allow = token.allowance(msg.sender, address(this));
        if (allow < tokensDeposited) revert InsufficientTokenAllowance(allow, tokensDeposited);

        uint256 liquidityMinted = (msg.value * totalLiquidity) / ethReserve;
        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;

        if (tokensDeposited < amountTokenMin) {
            revert InsufficientOutputAmount(tokensDeposited, amountTokenMin);
        }
        
        if (!token.transferFrom(msg.sender, address(this), tokensDeposited)) revert TokenTransferFailed();
        
        // Update oracle after liquidity addition
        if (oracleInitialized) {
            oracle.update(address(this).balance, token.balanceOf(address(this)));
        }

        emit LiquidityProvided(msg.sender, liquidityMinted, msg.value, tokensDeposited);
        return tokensDeposited;
    }

    /**
     * @notice Remove liquidity. Burns LP shares and returns proportional ETH + tokens.
     */
    function withdraw(uint256 amount, uint256 amountEthMin, uint256 amountTokenMin) 
        public 
        nonReentrant 
        whenNotPaused 
        returns (uint256 ethAmount, uint256 tokenAmount) 
    {
        uint256 availableLp = liquidity[msg.sender];
        if (availableLp < amount) revert InsufficientLiquidity(availableLp, amount);

        uint256 ethReserve = address(this).balance;
        uint256 tokenReserve = token.balanceOf(address(this));

        ethAmount = (amount * ethReserve) / totalLiquidity;
        tokenAmount = (amount * tokenReserve) / totalLiquidity;

        if (ethAmount < amountEthMin || tokenAmount < amountTokenMin) {
            revert InsufficientOutputAmount(ethAmount < amountEthMin ? ethAmount : tokenAmount, 
                                        ethAmount < amountEthMin ? amountEthMin : amountTokenMin);
        }
        
        liquidity[msg.sender] -= amount;
        totalLiquidity -= amount;

        (bool sent, ) = payable(msg.sender).call{ value: ethAmount }("");
        if (!sent) revert EthTransferFailed(msg.sender, ethAmount);

        if (!token.transfer(msg.sender, tokenAmount)) revert TokenTransferFailed();
        
        // Update oracle after liquidity removal
        if (oracleInitialized) {
            oracle.update(address(this).balance, token.balanceOf(address(this)));
        }

        emit LiquidityRemoved(msg.sender, amount, tokenAmount, ethAmount);
        return (ethAmount, tokenAmount);
    }

    /**
     * @notice Returns LP share balance for an address.
     */
    function getLiquidity(address lp) public view returns (uint256 lpLiquidity) {
        return liquidity[lp];
    }
    
    // Emergency functions
    function emergencyPause() external onlyOwner {
        paused = true;
    }
    
    function emergencyUnpause() external onlyOwner {
        paused = false;
    }
    
    function emergencyWithdraw(address tokenAddress, uint256 amount) external onlyOwner {
        if (tokenAddress == address(0)) {
            (bool sent, ) = payable(owner).call{ value: amount }("");
            require(sent, "ETH transfer failed");
        } else {
            IERC20(tokenAddress).transfer(owner, amount);
        }
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    // View functions for frontend
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountOut) 
    {
        return price(amountIn, reserveIn, reserveOut);
    }
    
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountIn) 
    {
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        return (numerator / denominator) + 1;
    }
    
    // Oracle functions
    function getTWAPrice(uint256 periodAgo) external view returns (uint256 price0, uint256 price1) {
        require(oracleInitialized, "Oracle not initialized");
        return oracle.consult(periodAgo);
    }
    
    function getCurrentPrice() external view returns (uint256 price0, uint256 price1) {
        require(oracleInitialized, "Oracle not initialized");
        return oracle.getCurrentPrice();
    }
    
    function isOracleReady() external view returns (bool) {
        if (!oracleInitialized) return false;
        return oracle.isReady();
    }
    
    // Flash swap protection
    function checkFlashSwapAttack(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        internal 
        view 
        returns (bool) 
    {
        if (!oracleInitialized) return true; // Skip check if oracle not ready
        
        try oracle.getCurrentPrice() returns (uint256 currentPrice0, uint256 currentPrice1) {
            // Calculate expected price based on input
            uint256 expectedPrice0 = reserveOut * 2**112 / reserveIn;
            
            // Allow 5% deviation from oracle price
            uint256 maxDeviation = currentPrice0 * 105 / 100;
            uint256 minDeviation = currentPrice0 * 95 / 100;
            
            return expectedPrice0 <= maxDeviation && expectedPrice0 >= minDeviation;
        } catch {
            return true; // If oracle fails, allow transaction
        }
    }
}
