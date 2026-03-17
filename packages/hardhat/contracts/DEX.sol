// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DEX - Decentralized Exchange
 * @notice A constant-product AMM (Automated Market Maker) like Uniswap V2
 * @dev Implements x * y = k formula with 0.3% trading fee
 */
contract DEX is ReentrancyGuard {
    IERC20 public immutable token;

    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    // Custom Errors
    error DexAlreadyInitialized();
    error TokenTransferFailed();
    error InvalidEthAmount();
    error InvalidTokenAmount();
    error InsufficientTokenBalance(uint256 available, uint256 required);
    error InsufficientTokenAllowance(uint256 available, uint256 required);
    error EthTransferFailed(address to, uint256 amount);
    error InsufficientLiquidity(uint256 available, uint256 required);
    error InsufficientOutputAmount();
    error ZeroReserve();

    // Events
    event EthToTokenSwap(address swapper, uint256 tokenOutput, uint256 ethInput);
    event TokenToEthSwap(address swapper, uint256 tokensInput, uint256 ethOutput);
    event LiquidityProvided(address liquidityProvider, uint256 liquidityMinted, uint256 ethInput, uint256 tokensInput);
    event LiquidityRemoved(address liquidityRemover, uint256 liquidityAmount, uint256 tokenOutput, uint256 ethOutput);

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
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
     * @notice Swap ETH for tokens with minimum output protection
     * @param minTokens Minimum tokens to receive (slippage protection)
     */
    function ethToToken(uint256 minTokens) public payable nonReentrant returns (uint256 tokenOutput) {
        if (msg.value == 0) revert InvalidEthAmount();

        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));

        // Prevent division by zero
        if (ethReserve == 0 || tokenReserve == 0) revert ZeroReserve();

        tokenOutput = price(msg.value, ethReserve, tokenReserve);

        // Slippage protection
        if (tokenOutput < minTokens) revert InsufficientOutputAmount();

        if (!token.transfer(msg.sender, tokenOutput)) revert TokenTransferFailed();

        emit EthToTokenSwap(msg.sender, tokenOutput, msg.value);
        return tokenOutput;
    }

    /**
     * @notice Swap tokens for ETH with minimum output protection
     * @param tokenInput Amount of tokens to swap
     * @param minEth Minimum ETH to receive (slippage protection)
     */
    function tokenToEth(uint256 tokenInput, uint256 minEth) public nonReentrant returns (uint256 ethOutput) {
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

        // Slippage protection
        if (ethOutput < minEth) revert InsufficientOutputAmount();

        if (!token.transferFrom(msg.sender, address(this), tokenInput)) revert TokenTransferFailed();

        (bool sent, ) = msg.sender.call{ value: ethOutput }("");
        if (!sent) revert EthTransferFailed(msg.sender, ethOutput);

        emit TokenToEthSwap(msg.sender, tokenInput, ethOutput);
        return ethOutput;
    }

    /**
     * @notice Add liquidity proportionally. Mints LP shares to sender.
     */
    function deposit() public payable nonReentrant returns (uint256 tokensDeposited) {
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

        if (!token.transferFrom(msg.sender, address(this), tokensDeposited)) revert TokenTransferFailed();

        emit LiquidityProvided(msg.sender, liquidityMinted, msg.value, tokensDeposited);
        return tokensDeposited;
    }

    /**
     * @notice Remove liquidity. Burns LP shares and returns proportional ETH + tokens.
     */
    function withdraw(uint256 amount) public nonReentrant returns (uint256 ethAmount, uint256 tokenAmount) {
        uint256 availableLp = liquidity[msg.sender];
        if (availableLp < amount) revert InsufficientLiquidity(availableLp, amount);

        uint256 ethReserve = address(this).balance;
        uint256 tokenReserve = token.balanceOf(address(this));

        ethAmount = (amount * ethReserve) / totalLiquidity;
        tokenAmount = (amount * tokenReserve) / totalLiquidity;

        liquidity[msg.sender] -= amount;
        totalLiquidity -= amount;

        (bool sent, ) = payable(msg.sender).call{ value: ethAmount }("");
        if (!sent) revert EthTransferFailed(msg.sender, ethAmount);

        if (!token.transfer(msg.sender, tokenAmount)) revert TokenTransferFailed();

        emit LiquidityRemoved(msg.sender, amount, tokenAmount, ethAmount);
        return (ethAmount, tokenAmount);
    }

    /**
     * @notice Returns LP share balance for an address.
     */
    function getLiquidity(address lp) public view returns (uint256 lpLiquidity) {
        return liquidity[lp];
    }
}
