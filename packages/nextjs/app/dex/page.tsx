"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Curve } from "./_components";
import { Address, AddressInput } from "@scaffold-ui/components";
import { useWatchBalance } from "@scaffold-ui/hooks";
import type { NextPage } from "next";
import { Address as AddressType, formatEther, isAddress, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const NUMBER_REGEX = /^\d*\.?\d*$/;

const toWei = (value: string): bigint => {
  if (!value || !NUMBER_REGEX.test(value)) return 0n;
  try {
    return parseEther(value);
  } catch {
    return 0n;
  }
};

const toFixedEth = (value?: bigint, fractionDigits = 4) => {
  return Number.parseFloat(formatEther(value ?? 0n)).toFixed(fractionDigits);
};

const DexPage: NextPage = () => {
  const curveWrapRef = useRef<HTMLDivElement>(null);
  const [curveSize, setCurveSize] = useState(420);

  const [activeTab, setActiveTab] = useState<"swap" | "pool">("swap");
  const [swapDirection, setSwapDirection] = useState<"ethToToken" | "tokenToEth">("ethToToken");
  const [swapAmount, setSwapAmount] = useState("");
  const [poolMode, setPoolMode] = useState<"deposit" | "withdraw">("deposit");
  const [poolAmount, setPoolAmount] = useState("");
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<"swap" | "pool" | "approve" | null>(null);

  const { address: connectedAccount } = useAccount();
  const { data: dexInfo } = useDeployedContractInfo({ contractName: "DEX" });
  const { data: balloonsInfo } = useDeployedContractInfo({ contractName: "Balloons" });

  const { writeContractAsync: writeDexContractAsync } = useScaffoldWriteContract({ contractName: "DEX" });
  const { writeContractAsync: writeBalloonsContractAsync } = useScaffoldWriteContract({ contractName: "Balloons" });

  const { data: dexTotalLiquidity } = useScaffoldReadContract({
    contractName: "DEX",
    functionName: "totalLiquidity",
  });

  const { data: userLiquidity } = useScaffoldReadContract({
    contractName: "DEX",
    functionName: "getLiquidity",
    args: [connectedAccount],
  });

  const { data: userBalloons } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [connectedAccount],
  });

  const { data: dexTokenReserve } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [dexInfo?.address],
  });

  const { data: dexEthBalance } = useWatchBalance({ address: dexInfo?.address });

  useEffect(() => {
    if (dexInfo?.address && !approveSpender) {
      setApproveSpender(dexInfo.address);
    }
  }, [dexInfo?.address, approveSpender]);

  useEffect(() => {
    const el = curveWrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect?.width ?? 0;
      if (!Number.isFinite(width) || width <= 0) return;
      setCurveSize(Math.max(300, Math.min(460, Math.floor(width))));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const swapAmountWei = useMemo(() => toWei(swapAmount), [swapAmount]);
  const poolAmountWei = useMemo(() => toWei(poolAmount), [poolAmount]);
  const approveAmountWei = useMemo(() => toWei(approveAmount), [approveAmount]);

  const handleSwap = async () => {
    if (swapAmountWei <= 0n) return;
    setIsSubmitting("swap");
    try {
      if (swapDirection === "ethToToken") {
        await writeDexContractAsync({
          functionName: "ethToToken",
          value: swapAmountWei,
        });
      } else {
        await writeDexContractAsync({
          functionName: "tokenToEth",
          args: [swapAmountWei],
        });
      }
      setSwapAmount("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handlePool = async () => {
    if (poolAmountWei <= 0n) return;
    setIsSubmitting("pool");
    try {
      if (poolMode === "deposit") {
        await writeDexContractAsync({
          functionName: "deposit",
          value: poolAmountWei,
        });
      } else {
        await writeDexContractAsync({
          functionName: "withdraw",
          args: [poolAmountWei],
        });
      }
      setPoolAmount("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleApprove = async () => {
    if (!isAddress(approveSpender) || approveAmountWei <= 0n) return;
    setIsSubmitting("approve");
    try {
      await writeBalloonsContractAsync({
        functionName: "approve",
        args: [approveSpender as AddressType, approveAmountWei],
      });
      setApproveAmount("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(null);
    }
  };

  const swapTitle = swapDirection === "ethToToken" ? "ETH -> BAL" : "BAL -> ETH";
  const swapHint = swapDirection === "ethToToken" ? "Pay ETH and receive Balloons" : "Pay Balloons and receive ETH";

  const curveEthInput = swapDirection === "ethToToken" ? Number.parseFloat(swapAmount || "0") || 0 : 0;
  const curveTokenInput = swapDirection === "tokenToEth" ? Number.parseFloat(swapAmount || "0") || 0 : 0;

  return (
    <div
      className="min-h-screen pb-12"
      style={{
        background:
          "radial-gradient(1000px 520px at 20% -10%, rgba(122,92,255,0.20), transparent 55%), radial-gradient(900px 420px at 85% 0%, rgba(255,78,175,0.16), transparent 52%), #0b0b13",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <div className="text-center mb-8">
          <p className="uppercase text-xs tracking-[0.25em] text-white/60">Speedrun Ethereum</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white mt-3">DEX</h1>
          <p className="text-white/70 mt-2">Uniswap-style swap flow with LP actions and live reserve visibility.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-widest text-white/60">Your BAL</p>
            <p className="text-2xl font-semibold text-white mt-1">{toFixedEth(userBalloons)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-widest text-white/60">Your LP</p>
            <p className="text-2xl font-semibold text-white mt-1">{toFixedEth(userLiquidity)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-widest text-white/60">Total Liquidity</p>
            <p className="text-2xl font-semibold text-white mt-1">{toFixedEth(dexTotalLiquidity)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="rounded-3xl border border-white/10 bg-[#161721]/95 shadow-[0_18px_50px_rgba(0,0,0,0.55)] p-5 sm:p-6">
            <div className="flex gap-2 mb-5 rounded-2xl bg-[#0f1018] p-1 border border-white/10">
              <button
                onClick={() => setActiveTab("swap")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                  activeTab === "swap" ? "bg-white text-[#111]" : "text-white/70 hover:text-white"
                }`}
              >
                Swap
              </button>
              <button
                onClick={() => setActiveTab("pool")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                  activeTab === "pool" ? "bg-white text-[#111]" : "text-white/70 hover:text-white"
                }`}
              >
                Pool
              </button>
            </div>

            {activeTab === "swap" ? (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSwapDirection("ethToToken")}
                    className={`rounded-xl px-3 py-2 text-sm font-medium border transition ${
                      swapDirection === "ethToToken"
                        ? "border-[#ff4ea0] bg-[#ff4ea0]/20 text-white"
                        : "border-white/15 bg-transparent text-white/75"
                    }`}
                  >
                    ETH to BAL
                  </button>
                  <button
                    onClick={() => setSwapDirection("tokenToEth")}
                    className={`rounded-xl px-3 py-2 text-sm font-medium border transition ${
                      swapDirection === "tokenToEth"
                        ? "border-[#7a5cff] bg-[#7a5cff]/20 text-white"
                        : "border-white/15 bg-transparent text-white/75"
                    }`}
                  >
                    BAL to ETH
                  </button>
                </div>

                <div className="rounded-2xl bg-[#10111a] border border-white/10 p-4">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/60">{swapTitle}</label>
                  <input
                    value={swapAmount}
                    onChange={event => setSwapAmount(event.target.value)}
                    placeholder="0.0"
                    inputMode="decimal"
                    className="mt-2 w-full bg-transparent text-3xl font-semibold text-white outline-none placeholder:text-white/35"
                  />
                  <p className="mt-2 text-sm text-white/65">{swapHint}</p>
                </div>

                <button
                  onClick={handleSwap}
                  disabled={swapAmountWei <= 0n || isSubmitting !== null}
                  className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(95deg, rgba(255,78,160,0.95) 0%, rgba(142,108,255,0.95) 55%, rgba(63,183,255,0.95) 100%)",
                  }}
                >
                  {isSubmitting === "swap" ? "Submitting swap..." : "Swap"}
                </button>
              </>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setPoolMode("deposit")}
                    className={`rounded-xl px-3 py-2 text-sm font-medium border transition ${
                      poolMode === "deposit"
                        ? "border-[#4de3b8] bg-[#4de3b8]/20 text-white"
                        : "border-white/15 bg-transparent text-white/75"
                    }`}
                  >
                    Add Liquidity
                  </button>
                  <button
                    onClick={() => setPoolMode("withdraw")}
                    className={`rounded-xl px-3 py-2 text-sm font-medium border transition ${
                      poolMode === "withdraw"
                        ? "border-[#ff9f6e] bg-[#ff9f6e]/20 text-white"
                        : "border-white/15 bg-transparent text-white/75"
                    }`}
                  >
                    Remove Liquidity
                  </button>
                </div>

                <div className="rounded-2xl bg-[#10111a] border border-white/10 p-4">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/60">
                    {poolMode === "deposit" ? "Deposit ETH" : "Withdraw LP"}
                  </label>
                  <input
                    value={poolAmount}
                    onChange={event => setPoolAmount(event.target.value)}
                    placeholder="0.0"
                    inputMode="decimal"
                    className="mt-2 w-full bg-transparent text-3xl font-semibold text-white outline-none placeholder:text-white/35"
                  />
                  <p className="mt-2 text-sm text-white/65">
                    {poolMode === "deposit"
                      ? "You will deposit ETH and the matching BAL ratio."
                      : "You will receive proportional ETH and BAL from the pool."}
                  </p>
                </div>

                <button
                  onClick={handlePool}
                  disabled={poolAmountWei <= 0n || isSubmitting !== null}
                  className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      poolMode === "deposit"
                        ? "linear-gradient(95deg, rgba(77,227,184,0.95) 0%, rgba(84,180,255,0.95) 100%)"
                        : "linear-gradient(95deg, rgba(255,159,110,0.95) 0%, rgba(255,95,145,0.95) 100%)",
                  }}
                >
                  {isSubmitting === "pool" ? "Submitting transaction..." : poolMode === "deposit" ? "Add" : "Remove"}
                </button>
              </>
            )}

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#10111a] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">Approve BAL</p>
              <AddressInput
                value={approveSpender}
                onChange={value => setApproveSpender(value)}
                placeholder="Spender address"
              />
              <input
                value={approveAmount}
                onChange={event => setApproveAmount(event.target.value)}
                placeholder="Amount (e.g. 10)"
                inputMode="decimal"
                className="mt-3 w-full rounded-xl bg-[#171827] border border-white/10 p-3 text-white outline-none focus:border-white/35"
              />
              <button
                onClick={handleApprove}
                disabled={!isAddress(approveSpender) || approveAmountWei <= 0n || isSubmitting !== null}
                className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting === "approve" ? "Approving..." : "Approve"}
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#161721]/95 p-5 sm:p-6">
              <h2 className="text-white text-lg font-semibold">Pool Reserves</h2>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl bg-[#10111a] border border-white/10 p-3">
                  <p className="text-xs text-white/60 uppercase tracking-wide">ETH</p>
                  <p className="text-white text-xl font-semibold mt-1">{toFixedEth(dexEthBalance?.value)}</p>
                </div>
                <div className="rounded-xl bg-[#10111a] border border-white/10 p-3">
                  <p className="text-xs text-white/60 uppercase tracking-wide">BAL</p>
                  <p className="text-white text-xl font-semibold mt-1">{toFixedEth(dexTokenReserve)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="rounded-xl bg-[#10111a] border border-white/10 p-3">
                  <p className="text-white/60 mb-1">DEX Contract</p>
                  <Address address={dexInfo?.address} size="sm" />
                </div>
                <div className="rounded-xl bg-[#10111a] border border-white/10 p-3">
                  <p className="text-white/60 mb-1">Balloons Contract</p>
                  <Address address={balloonsInfo?.address} size="sm" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#161721]/95 p-5 sm:p-6">
              <h2 className="text-white text-lg font-semibold mb-3">Price Curve</h2>
              <div ref={curveWrapRef} className="w-full flex justify-center">
                <Curve
                  addingEth={curveEthInput}
                  addingToken={curveTokenInput}
                  ethReserve={Number.parseFloat(formatEther(dexEthBalance?.value || 0n))}
                  tokenReserve={Number.parseFloat(formatEther(dexTokenReserve || 0n))}
                  width={curveSize}
                  height={curveSize}
                />
              </div>
              <p className="mt-3 text-xs text-white/60">
                Large swaps move farther on the curve and create more slippage.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DexPage;
