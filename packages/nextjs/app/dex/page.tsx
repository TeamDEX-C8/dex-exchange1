"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Curve } from "./_components";
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

const shortAddress = (address?: string) => {
  if (!address) return "Not deployed";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
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

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: (i * 19 + 11) % 100,
        top: (i * 13 + 17) % 100,
        size: 2 + (i % 3) * 2,
        delay: (i % 7) * 0.8,
        duration: 7 + (i % 5) * 1.8,
        opacity: 0.1 + (i % 5) * 0.08,
      })),
    [],
  );

  const { address: connectedAccount } = useAccount();
  const { data: dexInfo } = useDeployedContractInfo({ contractName: "DEX" });
  const { data: balloonsInfo } = useDeployedContractInfo({ contractName: "Balloons" });

  const { writeContractAsync: writeDexContractAsync } = useScaffoldWriteContract({ contractName: "DEX" });
  const { writeContractAsync: writeBalloonsContractAsync } = useScaffoldWriteContract({ contractName: "Balloons" });

  const { data: dexTotalLiquidity } = useScaffoldReadContract({
    contractName: "DEX",
    functionName: "totalLiquidity",
    query: { refetchInterval: 4000 },
  });

  const { data: userLiquidity } = useScaffoldReadContract({
    contractName: "DEX",
    functionName: "getLiquidity",
    args: [connectedAccount],
    query: { refetchInterval: 4000 },
  });

  const { data: userBalloons } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [connectedAccount],
    query: { refetchInterval: 4000 },
  });

  const { data: dexTokenReserve } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [dexInfo?.address],
    query: { refetchInterval: 4000 },
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

  const ethReserve = dexEthBalance?.value ?? 0n;
  const tokenReserve = dexTokenReserve ?? 0n;
  const isPoolInitialized = (dexTotalLiquidity ?? 0n) > 0n;

  const ethPerBal = useMemo(() => {
    if (tokenReserve === 0n) return "0.000000";
    const eth = Number.parseFloat(formatEther(ethReserve));
    const bal = Number.parseFloat(formatEther(tokenReserve));
    if (!Number.isFinite(eth) || !Number.isFinite(bal) || bal === 0) return "0.000000";
    return (eth / bal).toFixed(6);
  }, [ethReserve, tokenReserve]);

  const kApprox = useMemo(() => {
    const eth = Number.parseFloat(formatEther(ethReserve));
    const bal = Number.parseFloat(formatEther(tokenReserve));
    if (!Number.isFinite(eth) || !Number.isFinite(bal)) return "0.0000";
    return (eth * bal).toFixed(4);
  }, [ethReserve, tokenReserve]);

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

  const swapTitle = swapDirection === "ethToToken" ? "ETH to BAL" : "BAL to ETH";
  const swapHint = swapDirection === "ethToToken" ? "Pay ETH and receive Balloons" : "Pay Balloons and receive ETH";

  const curveEthInput = swapDirection === "ethToToken" ? Number.parseFloat(swapAmount || "0") || 0 : 0;
  const curveTokenInput = swapDirection === "tokenToEth" ? Number.parseFloat(swapAmount || "0") || 0 : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 580px at 16% -10%, rgba(76,129,255,0.24), transparent 55%), radial-gradient(920px 520px at 90% 0%, rgba(28,212,199,0.2), transparent 58%), #070b14",
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <span
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: "rgba(132, 191, 255, 0.95)",
              opacity: particle.opacity,
              boxShadow: "0 0 14px rgba(132,191,255,0.55)",
              animation: `floatParticle ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border border-[#7db4ff]/40 bg-[#101a2b]/70 shadow-[0_0_26px_rgba(76,129,255,0.28)]">
            <svg viewBox="0 0 48 48" width="24" height="24" fill="none" aria-hidden>
              <circle cx="24" cy="24" r="22" stroke="#8FC4FF" strokeWidth="1.5" opacity="0.8" />
              <path
                d="M11 30h22l-4 4"
                stroke="#7df7dc"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M37 18H15l4-4" stroke="#8f9bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-left leading-tight">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#9fc3f5]">Fintech Exchange</p>
              <p className="text-white font-semibold">FluxSwap DEX</p>
            </div>
          </div>
          <p className="text-[#c5d7f4] mt-4">Fast swaps, clear liquidity controls, and real-time reserve feedback.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="rounded-2xl border border-white/15 bg-[#101724]/85 p-4">
            <p className="text-xs uppercase tracking-widest text-[#8aa2c4]">Your BAL</p>
            <p className="text-2xl font-semibold text-[#f5f8ff] mt-1">{toFixedEth(userBalloons)}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-[#101724]/85 p-4">
            <p className="text-xs uppercase tracking-widest text-[#8aa2c4]">Your LP</p>
            <p className="text-2xl font-semibold text-[#f5f8ff] mt-1">{toFixedEth(userLiquidity)}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-[#101724]/85 p-4">
            <p className="text-xs uppercase tracking-widest text-[#8aa2c4]">Total Liquidity</p>
            <p className="text-2xl font-semibold text-[#f5f8ff] mt-1">{toFixedEth(dexTotalLiquidity)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="rounded-3xl border border-white/15 bg-[#0f1726]/95 shadow-[0_18px_55px_rgba(0,0,0,0.55)] p-5 sm:p-6">
            <div className="flex gap-2 mb-5 rounded-2xl bg-[#0a111d] p-1 border border-white/15">
              <button
                onClick={() => setActiveTab("swap")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  activeTab === "swap"
                    ? "bg-[linear-gradient(110deg,#49a3ff,#3b7bff)] text-[#f7fbff]"
                    : "text-[#aec1de] hover:text-[#f7fbff]"
                }`}
              >
                Swap
              </button>
              <button
                onClick={() => setActiveTab("pool")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  activeTab === "pool"
                    ? "bg-[linear-gradient(110deg,#1dd3c7,#278af7)] text-[#f7fbff]"
                    : "text-[#aec1de] hover:text-[#f7fbff]"
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
                        ? "border-[#4ca6ff] bg-[#4ca6ff]/20 text-[#f3f9ff]"
                        : "border-white/15 bg-transparent text-[#aec1de]"
                    }`}
                  >
                    ETH to BAL
                  </button>
                  <button
                    onClick={() => setSwapDirection("tokenToEth")}
                    className={`rounded-xl px-3 py-2 text-sm font-medium border transition ${
                      swapDirection === "tokenToEth"
                        ? "border-[#1dd3c7] bg-[#1dd3c7]/20 text-[#f3f9ff]"
                        : "border-white/15 bg-transparent text-[#aec1de]"
                    }`}
                  >
                    BAL to ETH
                  </button>
                </div>

                <div className="rounded-2xl bg-[#0b1220] border border-white/15 p-4">
                  <label className="text-xs uppercase tracking-[0.2em] text-[#8aa2c4]">{swapTitle}</label>
                  <input
                    value={swapAmount}
                    onChange={event => setSwapAmount(event.target.value)}
                    placeholder="0.0"
                    inputMode="decimal"
                    className="mt-2 w-full bg-transparent text-3xl font-semibold text-[#f4f8ff] outline-none placeholder:text-[#617da4]"
                  />
                  <p className="mt-2 text-sm text-[#9cb2d2]">{swapHint}</p>
                </div>

                <button
                  onClick={handleSwap}
                  disabled={swapAmountWei <= 0n || isSubmitting !== null || !isPoolInitialized}
                  className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-[#f7fbff] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(95deg, #3f8bff 0%, #1dcac1 100%)" }}
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
                        ? "border-[#1dd3c7] bg-[#1dd3c7]/20 text-[#f3f9ff]"
                        : "border-white/15 bg-transparent text-[#aec1de]"
                    }`}
                  >
                    Add Liquidity
                  </button>
                  <button
                    onClick={() => setPoolMode("withdraw")}
                    className={`rounded-xl px-3 py-2 text-sm font-medium border transition ${
                      poolMode === "withdraw"
                        ? "border-[#ff9f6e] bg-[#ff9f6e]/20 text-[#f3f9ff]"
                        : "border-white/15 bg-transparent text-[#aec1de]"
                    }`}
                  >
                    Remove Liquidity
                  </button>
                </div>

                <div className="rounded-2xl bg-[#0b1220] border border-white/15 p-4">
                  <label className="text-xs uppercase tracking-[0.2em] text-[#8aa2c4]">
                    {poolMode === "deposit" ? "Deposit ETH" : "Withdraw LP"}
                  </label>
                  <input
                    value={poolAmount}
                    onChange={event => setPoolAmount(event.target.value)}
                    placeholder="0.0"
                    inputMode="decimal"
                    className="mt-2 w-full bg-transparent text-3xl font-semibold text-[#f4f8ff] outline-none placeholder:text-[#617da4]"
                  />
                  <p className="mt-2 text-sm text-[#9cb2d2]">
                    {poolMode === "deposit"
                      ? "Deposit ETH and matching BAL to keep reserve ratio stable."
                      : "Withdraw LP to receive proportional ETH and BAL."}
                  </p>
                </div>

                <button
                  onClick={handlePool}
                  disabled={poolAmountWei <= 0n || isSubmitting !== null || !isPoolInitialized}
                  className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-[#f7fbff] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      poolMode === "deposit"
                        ? "linear-gradient(95deg, #1dd3c7 0%, #52b4ff 100%)"
                        : "linear-gradient(95deg, #ff9f6e 0%, #ff6aa0 100%)",
                  }}
                >
                  {isSubmitting === "pool" ? "Submitting transaction..." : poolMode === "deposit" ? "Add" : "Remove"}
                </button>
              </>
            )}

            <div className="mt-6 rounded-2xl border border-white/15 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8aa2c4] mb-2">Approve BAL</p>
              <input
                value={approveSpender}
                onChange={event => setApproveSpender(event.target.value)}
                placeholder="Spender address"
                inputMode="text"
                className="w-full rounded-xl bg-[#111b2d] border border-white/15 p-3 text-[#f4f8ff] outline-none placeholder:text-[#617da4]"
              />
              <input
                value={approveAmount}
                onChange={event => setApproveAmount(event.target.value)}
                placeholder="Amount (e.g. 10)"
                inputMode="decimal"
                className="mt-3 w-full rounded-xl bg-[#111b2d] border border-white/15 p-3 text-[#f4f8ff] outline-none placeholder:text-[#617da4]"
              />
              <button
                onClick={handleApprove}
                disabled={!isAddress(approveSpender) || approveAmountWei <= 0n || isSubmitting !== null}
                className="mt-3 w-full rounded-xl border border-[#4ca6ff]/35 bg-[#173358] py-2.5 text-sm font-semibold text-[#f4f8ff] hover:bg-[#1b3f6f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting === "approve" ? "Approving..." : "Approve"}
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-white/15 bg-[#0f1726]/95 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[#f7fbff] text-lg font-semibold">Pool Reserves</h2>
                <span className="text-xs text-[#8aa2c4]">Auto-refresh every 4s</span>
              </div>

              {!isPoolInitialized && (
                <div className="mt-3 rounded-xl border border-[#ff9f6e]/40 bg-[#362315] p-3 text-sm text-[#ffd4ba]">
                  Pool is not initialized yet. Run deploy init or seed liquidity before swapping.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl bg-[#0b1220] border border-white/15 p-3">
                  <p className="text-xs text-[#8aa2c4] uppercase tracking-wide">ETH Reserve</p>
                  <p className="text-[#f4f8ff] text-xl font-semibold mt-1">{toFixedEth(ethReserve)}</p>
                </div>
                <div className="rounded-xl bg-[#0b1220] border border-white/15 p-3">
                  <p className="text-xs text-[#8aa2c4] uppercase tracking-wide">BAL Reserve</p>
                  <p className="text-[#f4f8ff] text-xl font-semibold mt-1">{toFixedEth(tokenReserve)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl bg-[#0b1220] border border-white/15 p-3">
                  <p className="text-xs text-[#8aa2c4] uppercase tracking-wide">ETH per BAL</p>
                  <p className="text-[#f4f8ff] text-lg font-semibold mt-1">{ethPerBal}</p>
                </div>
                <div className="rounded-xl bg-[#0b1220] border border-white/15 p-3">
                  <p className="text-xs text-[#8aa2c4] uppercase tracking-wide">k (approx)</p>
                  <p className="text-[#f4f8ff] text-lg font-semibold mt-1">{kApprox}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="rounded-xl bg-[#0b1220] border border-white/15 p-3">
                  <p className="text-[#8aa2c4] mb-1">DEX Contract</p>
                  <p className="text-[#e3ecff] font-mono">{shortAddress(dexInfo?.address)}</p>
                </div>
                <div className="rounded-xl bg-[#0b1220] border border-white/15 p-3">
                  <p className="text-[#8aa2c4] mb-1">Balloons Contract</p>
                  <p className="text-[#e3ecff] font-mono">{shortAddress(balloonsInfo?.address)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-[#0f1726]/95 p-5 sm:p-6">
              <h2 className="text-[#f7fbff] text-lg font-semibold mb-3">Price Curve</h2>
              <div ref={curveWrapRef} className="w-full flex justify-center">
                <Curve
                  addingEth={curveEthInput}
                  addingToken={curveTokenInput}
                  ethReserve={Number.parseFloat(formatEther(ethReserve || 0n))}
                  tokenReserve={Number.parseFloat(formatEther(tokenReserve || 0n))}
                  width={curveSize}
                  height={curveSize}
                />
              </div>
              <p className="mt-3 text-xs text-[#9cb2d2]">
                Bigger swaps move farther on the curve and increase slippage.
              </p>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatParticle {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -14px, 0) scale(1.2);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default DexPage;
