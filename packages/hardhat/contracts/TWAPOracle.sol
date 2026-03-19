// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TWAP Oracle - Time-Weighted Average Price Oracle
 * @notice Provides price feeds using cumulative price tracking
 * @dev Based on Uniswap V2 oracle design
 */
contract TWAPOracle {
    struct Observation {
        uint256 timestamp;
        uint256 price0Cumulative;
        uint256 price1Cumulative;
    }

    IERC20 public immutable token0;
    IERC20 public immutable token1;
    
    uint256 public constant MINIMUM_ELAPSED_TIME = 1 hours;
    uint256 public constant GRACE_PERIOD_TIME = 1 hours;
    uint256 public constant CARDINALITY = 1; // Start with 1 observation slot
    
    Observation[CARDINALITY] public observations;
    uint256 public index;
    uint256 public pairBalance0;
    uint256 public pairBalance1;
    bool public initialized;
    
    event Updated(uint256 price0Cumulative, uint256 price1Cumulative, uint256 timestamp);
    
    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }
    
    /**
     * @notice Update the oracle with current reserves
     * @dev Should be called every time a swap occurs
     */
    function update(uint256 balance0, uint256 balance1) external {
        if (balance0 == 0 || balance1 == 0) revert("Zero balance");
        if (!initialized) revert("Not initialized");
        
        uint256 timestamp = block.timestamp;
        uint256 timeElapsed = timestamp - observations[index].timestamp;
        
        if (timeElapsed > 0) {
            uint256 price0Cumulative = observations[index].price0Cumulative + 
                (balance1 * 2**112 / balance0) * timeElapsed;
            uint256 price1Cumulative = observations[index].price1Cumulative + 
                (balance0 * 2**112 / balance1) * timeElapsed;
            
            index = (index + 1) % CARDINALITY;
            observations[index] = Observation({
                timestamp: timestamp,
                price0Cumulative: price0Cumulative,
                price1Cumulative: price1Cumulative
            });
            
            pairBalance0 = balance0;
            pairBalance1 = balance1;
            
            emit Updated(price0Cumulative, price1Cumulative, timestamp);
        }
    }
    
    /**
     * @notice Initialize the oracle
     */
    function initialize(uint256 balance0, uint256 balance1) external {
        require(!initialized, "Already initialized");
        
        observations[0] = Observation({
            timestamp: block.timestamp,
            price0Cumulative: 0,
            price1Cumulative: 0
        });
        
        pairBalance0 = balance0;
        pairBalance1 = balance1;
        initialized = true;
    }
    
    /**
     * @notice Get the time-weighted average price
     * @param periodAgo The period in seconds to look back
     */
    function consult(uint256 periodAgo) external view returns (uint256 price0, uint256 price1) {
        require(initialized, "Not initialized");
        
        uint256 targetTimestamp = block.timestamp - periodAgo;
        uint256 currentIndex = index;
        uint256 oldestTimestamp = observations[currentIndex].timestamp;
        
        // If target is older than our oldest observation, use the oldest
        if (targetTimestamp < oldestTimestamp) {
            targetTimestamp = oldestTimestamp;
        }
        
        uint256 previousIndex = currentIndex == 0 ? CARDINALITY - 1 : currentIndex - 1;
        uint256 previousTimestamp = observations[previousIndex].timestamp;
        
        uint256 timeElapsed = observations[currentIndex].timestamp - previousTimestamp;
        require(timeElapsed >= MINIMUM_ELAPSED_TIME, "Insufficient time elapsed");
        
        if (timeElapsed > 0) {
            price0 = (observations[currentIndex].price0Cumulative - observations[previousIndex].price0Cumulative) / timeElapsed;
            price1 = (observations[currentIndex].price1Cumulative - observations[previousIndex].price1Cumulative) / timeElapsed;
        } else {
            // Fallback to current price if no time elapsed
            price0 = pairBalance1 * 2**112 / pairBalance0;
            price1 = pairBalance0 * 2**112 / pairBalance1;
        }
    }
    
    /**
     * @notice Get current price (not time-weighted)
     */
    function getCurrentPrice() external view returns (uint256 price0, uint256 price1) {
        if (pairBalance0 == 0 || pairBalance1 == 0) return (0, 0);
        
        price0 = pairBalance1 * 2**112 / pairBalance0;
        price1 = pairBalance0 * 2**112 / pairBalance1;
    }
    
    /**
     * @notice Check if oracle is ready for consultation
     */
    function isReady() external view returns (bool) {
        if (!initialized) return false;
        
        uint256 currentIndex = index;
        uint256 previousIndex = currentIndex == 0 ? CARDINALITY - 1 : currentIndex - 1;
        uint256 timeElapsed = observations[currentIndex].timestamp - observations[previousIndex].timestamp;
        
        return timeElapsed >= MINIMUM_ELAPSED_TIME;
    }
}
