import { useMemo } from "react";
import { Address } from "viem";
import { useBalance, useReadContract } from "wagmi";
import { DEX } from "~~/contracts/deployedContracts";

const DEX_ABI = DEX.abi;

/**
 * Calculates price impact for swapping ETH to Tokens
 *
 * Price Impact = ((Spot Price - Execution Price) / Spot Price) * 100
 *
 * - Spot Price: The current market price before the trade
 * - Execution Price: The actual price including slippage/fee impact
 */
export function usePriceImpact(
  dexAddress: Address,
  tokenAddress: Address,
  inputAmount: bigint | undefined,
  isEnabled: boolean = true,
) {
  // Get ETH reserve (contract's ETH balance)
  const { data: ethBalance } = useBalance({
    address: dexAddress,
    query: {
      enabled: isEnabled && !!dexAddress,
    },
  });

  // Get token reserve (Balloons balance of DEX)
  const { data: tokenReserve } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [dexAddress],
    query: {
      enabled: isEnabled && !!dexAddress && !!tokenAddress,
    },
  });

  return useMemo(() => {
    if (!inputAmount || inputAmount === 0n) {
      return {
        spotPrice: 0n,
        executionPrice: 0n,
        priceImpact: 0,
        warning: false,
        isLoading: true,
      };
    }

    if (!ethBalance?.value || !tokenReserve) {
      return {
        spotPrice: 0n,
        executionPrice: 0n,
        priceImpact: 0,
        warning: false,
        isLoading: true,
      };
    }

    const ethReserve = ethBalance.value;
    const tokenRes = tokenReserve;

    // Prevent division by zero
    if (ethReserve === 0n || tokenRes === 0n) {
      return {
        spotPrice: 0n,
        executionPrice: 0n,
        priceImpact: 0,
        warning: false,
        isLoading: false,
      };
    }

    // SPOT PRICE: Current market price (no trade yet)
    // tokens per ETH = tokenReserve / ethReserve
    // Multiply by 1e18 for precision
    const spotPrice = (tokenRes * 1_000_000_000_000_000_000n) / ethReserve;

    // EXECUTION PRICE: Price after trade (includes 0.3% fee)
    // Formula: output = (input * 997 * tokenReserve) / (ethReserve * 1000 + input * 997)
    const inputWithFee = (inputAmount * 997n) / 1000n;

    let executionOutput: bigint = 0n;
    if (inputWithFee > 0n) {
      executionOutput = (tokenRes * inputWithFee) / (ethReserve * 1000n + inputAmount * 997n);
    }

    // Avoid division by zero
    if (executionOutput === 0n) {
      return {
        spotPrice,
        executionPrice: 0n,
        priceImpact: 100, // Maximum impact
        warning: true,
        isLoading: false,
      };
    }

    // Execution price in tokens per ETH (with fee impact)
    const executionPrice = (executionOutput * 1_000_000_000_000_000_000n) / inputAmount;

    // PRICE IMPACT PERCENTAGE
    // ((Spot - Execution) / Spot) * 100
    // Using bigint for precision, then converting to number for display
    let priceImpactRaw = spotPrice - executionPrice;

    // Handle negative price impact (rare but possible with large trades)
    if (priceImpactRaw < 0n) {
      priceImpactRaw = 0n;
    }

    // Calculate percentage with 2 decimal precision
    const priceImpact = Number((priceImpactRaw * 10000n) / spotPrice) / 100;

    // Warning threshold: >5%
    const warning = priceImpact > 5;

    return {
      spotPrice,
      executionPrice,
      priceImpact,
      warning,
      isLoading: false,
    };
  }, [inputAmount, ethBalance?.value, tokenReserve]);
}

/**
 * Alternative hook for Token to ETH swaps
 */
export function usePriceImpactTokenToEth(
  dexAddress: Address,
  tokenAddress: Address,
  inputAmount: bigint | undefined,
  isEnabled: boolean = true,
) {
  const { data: ethBalance } = useBalance({
    address: dexAddress,
    query: {
      enabled: isEnabled && !!dexAddress,
    },
  });

  const { data: tokenReserve } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [dexAddress],
    query: {
      enabled: isEnabled && !!dexAddress && !!tokenAddress,
    },
  });

  return useMemo(() => {
    if (!inputAmount || inputAmount === 0n) {
      return {
        spotPrice: 0n,
        executionPrice: 0n,
        priceImpact: 0,
        warning: false,
        isLoading: true,
      };
    }

    if (!ethBalance?.value || !tokenReserve) {
      return {
        spotPrice: 0n,
        executionPrice: 0n,
        priceImpact: 0,
        warning: false,
        isLoading: true,
      };
    }

    const ethReserve = ethBalance.value;
    const tokenRes = tokenReserve;

    if (ethReserve === 0n || tokenRes === 0n) {
      return {
        spotPrice: 0n,
        executionPrice: 0n,
        priceImpact: 0,
        warning: false,
        isLoading: false,
      };
    }

    // SPOT PRICE: ETH per token
    const spotPrice = (ethReserve * 1_000_000_000_000_000_000n) / tokenRes;

    // EXECUTION PRICE with 0.3% fee
    const inputWithFee = (inputAmount * 997n) / 1000n;

    let executionOutput: bigint = 0n;
    if (inputWithFee > 0n) {
      executionOutput = (ethReserve * inputWithFee) / (tokenRes * 1000n + inputAmount * 997n);
    }

    if (executionOutput === 0n) {
      return {
        spotPrice,
        executionPrice: 0n,
        priceImpact: 100,
        warning: true,
        isLoading: false,
      };
    }

    const executionPrice = (executionOutput * 1_000_000_000_000_000_000n) / inputAmount;

    let priceImpactRaw = spotPrice - executionPrice;
    if (priceImpactRaw < 0n) {
      priceImpactRaw = 0n;
    }

    const priceImpact = Number((priceImpactRaw * 10000n) / spotPrice) / 100;
    const warning = priceImpact > 5;

    return {
      spotPrice,
      executionPrice,
      priceImpact,
      warning,
      isLoading: false,
    };
  }, [inputAmount, ethBalance?.value, tokenReserve]);
}
