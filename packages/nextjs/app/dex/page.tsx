"use client";

import { useEffect, useRef, useState } from "react";
import { Curve } from "./_components";
import { Address, AddressInput, Balance, EtherInput } from "@scaffold-ui/components";
import { IntegerInput } from "@scaffold-ui/debug-contracts";
import { useWatchBalance } from "@scaffold-ui/hooks";
import type { NextPage } from "next";
import { Address as AddressType, formatEther, isAddress, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const NUMBER_REGEX = /^\.?\d+\.?\d*$/;

const Dex: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const curveWrapRef = useRef<HTMLDivElement>(null);
  const [curveSize, setCurveSize] = useState(500);
  const [ethToTokenAmount, setEthToTokenAmount] = useState("");
  const [tokenToETHAmount, setTokenToETHAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [accountBalanceOf, setAccountBalanceOf] = useState("");
  const [ethToTokenInputKey, setEthToTokenInputKey] = useState(0);
  const [depositInputKey, setDepositInputKey] = useState(0);
  const [withdrawInputKey, setWithdrawInputKey] = useState(0);

  const { data: DEXInfo } = useDeployedContractInfo({ contractName: "DEX" });
  const { data: BalloonsInfo } = useDeployedContractInfo({ contractName: "Balloons" });
  const { address: connectedAccount } = useAccount();

  const { data: DEXBalloonBalance } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [DEXInfo?.address?.toString()],
  });

  useEffect(() => {
    if (DEXBalloonBalance !== undefined) setIsLoading(false);
  }, [DEXBalloonBalance]);

  useEffect(() => {
    const el = curveWrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect?.width ?? 0;
      if (!Number.isFinite(width) || width <= 0) return;
      setCurveSize(Math.max(260, Math.min(500, Math.floor(width))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { data: DEXtotalLiquidity } = useScaffoldReadContract({ contractName: "DEX", functionName: "totalLiquidity" });
  const { writeContractAsync: writeDexContractAsync } = useScaffoldWriteContract({ contractName: "DEX" });
  const { writeContractAsync: writeBalloonsContractAsync } = useScaffoldWriteContract({ contractName: "Balloons" });

  const { data: balanceOfWrite } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [accountBalanceOf as AddressType],
    query: { enabled: isAddress(accountBalanceOf) },
  });

  const { data: contractBalance } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [DEXInfo?.address],
  });

  const { data: userBalloons } = useScaffoldReadContract({
    contractName: "Balloons",
    functionName: "balanceOf",
    args: [connectedAccount],
  });

  const { data: userLiquidity } = useScaffoldReadContract({
    contractName: "DEX",
    functionName: "getLiquidity",
    args: [connectedAccount],
  });

  const { data: contractETHBalance } = useWatchBalance({ address: DEXInfo?.address });

  return (
    <div className="min-h-screen" style={{ background: "#060d14" }}>
      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <p className="cyber-label mb-1">Speedrun Ethereum</p>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#e0f7ff" }}>
          ⚖️ DEX Exchange
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#5eafc6" }}>
          Constant-product AMM · 0.3% swap fee
        </p>

        {/* Stats bar */}
        <div className="flex justify-center gap-8 mt-6 flex-wrap">
          <div className="text-center">
            <p className="cyber-label">Your $BAL</p>
            <p className="cyber-value text-lg">🎈 {parseFloat(formatEther(userBalloons || 0n)).toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="cyber-label">Your Liquidity</p>
            <p className="cyber-value text-lg">💧 {parseFloat(formatEther(userLiquidity || 0n)).toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="cyber-label">Pool Liquidity</p>
            <p className="cyber-value text-lg">
              {DEXtotalLiquidity ? parseFloat(formatEther(DEXtotalLiquidity)).toFixed(4) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 pb-16 max-w-6xl mx-auto">
        {/* Left column */}
        <div className="space-y-5">
          {/* DEX Contract card */}
          <div className="cyber-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff]"></span>
              <span className="cyber-label">DEX Contract</span>
            </div>
            <div className="flex items-center justify-between mb-5">
              <Address size="sm" address={DEXInfo?.address} />
              <div className="flex items-center gap-3 text-sm" style={{ color: "#cce8f4" }}>
                <Balance style={{ fontSize: "0.9rem" }} address={DEXInfo?.address} />
                <span style={{ color: "#5eafc6" }}>·</span>
                {isLoading ? (
                  <span className="loading loading-dots loading-xs"></span>
                ) : (
                  <span>🎈 {parseFloat(formatEther(DEXBalloonBalance || 0n)).toFixed(4)}</span>
                )}
              </div>
            </div>

            <hr className="cyber-divider mb-5" />

            {/* Swap section */}
            <p className="cyber-label mb-3">Swap</p>
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: "#5eafc6" }}>
                    ETH → $BAL
                  </p>
                  <EtherInput
                    key={ethToTokenInputKey}
                    defaultValue={ethToTokenAmount}
                    onValueChange={({ valueInEth }) => {
                      setTokenToETHAmount("");
                      setEthToTokenAmount(valueInEth);
                    }}
                    name="ethToToken"
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm px-5"
                  onClick={async () => {
                    try {
                      await writeDexContractAsync({
                        functionName: "ethToToken",
                        value: NUMBER_REGEX.test(ethToTokenAmount) ? parseEther(ethToTokenAmount) : 0n,
                      });
                      setEthToTokenAmount("");
                      setTokenToETHAmount("");
                      setEthToTokenInputKey(k => k + 1);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Swap
                </button>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: "#5eafc6" }}>
                    $BAL → ETH
                  </p>
                  <IntegerInput
                    value={tokenToETHAmount}
                    onChange={value => {
                      setEthToTokenAmount("");
                      setTokenToETHAmount(value.toString());
                    }}
                    name="tokenToETH"
                    disableMultiplyBy1e18
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm px-5"
                  onClick={async () => {
                    try {
                      await writeDexContractAsync({
                        functionName: "tokenToEth",
                        args: [
                          NUMBER_REGEX.test(tokenToETHAmount)
                            ? parseEther(tokenToETHAmount)
                            : BigInt(tokenToETHAmount || "0"),
                        ],
                      });
                      setEthToTokenAmount("");
                      setTokenToETHAmount("");
                      setEthToTokenInputKey(k => k + 1);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Swap
                </button>
              </div>
            </div>

            <hr className="cyber-divider my-5" />

            {/* Liquidity section */}
            <p className="cyber-label mb-3">Liquidity</p>
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: "#5eafc6" }}>
                    Deposit ETH
                  </p>
                  <EtherInput
                    key={depositInputKey}
                    defaultValue={depositAmount}
                    onValueChange={({ valueInEth }) => setDepositAmount(valueInEth)}
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm px-5"
                  onClick={async () => {
                    try {
                      await writeDexContractAsync({
                        functionName: "deposit",
                        value: NUMBER_REGEX.test(depositAmount) ? parseEther(depositAmount) : 0n,
                      });
                      setDepositAmount("");
                      setDepositInputKey(k => k + 1);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Add
                </button>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: "#5eafc6" }}>
                    Withdraw LP
                  </p>
                  <EtherInput
                    key={withdrawInputKey}
                    defaultValue={withdrawAmount}
                    onValueChange={({ valueInEth }) => setWithdrawAmount(valueInEth)}
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm px-5"
                  onClick={async () => {
                    try {
                      await writeDexContractAsync({
                        functionName: "withdraw",
                        // @ts-expect-error - user may type invalid number
                        args: [NUMBER_REGEX.test(withdrawAmount) ? parseEther(withdrawAmount) : withdrawAmount],
                      });
                      setWithdrawAmount("");
                      setWithdrawInputKey(k => k + 1);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Balloons card */}
          <div className="cyber-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff]"></span>
              <span className="cyber-label">Balloons ($BAL)</span>
            </div>
            <div className="mb-4">
              <Address size="sm" address={BalloonsInfo?.address} />
            </div>

            <hr className="cyber-divider mb-4" />

            <p className="cyber-label mb-3">Approve Spender</p>
            <div className="space-y-3">
              <AddressInput
                value={approveSpender ?? ""}
                onChange={value => setApproveSpender(value)}
                placeholder="Spender address"
              />
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <IntegerInput
                    value={approveAmount}
                    onChange={value => setApproveAmount(value.toString())}
                    placeholder="Amount"
                    disableMultiplyBy1e18
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm px-5"
                  onClick={async () => {
                    try {
                      await writeBalloonsContractAsync({
                        functionName: "approve",
                        args: [
                          approveSpender as AddressType,
                          // @ts-expect-error - user may type invalid number
                          NUMBER_REGEX.test(approveAmount) ? parseEther(approveAmount) : approveAmount,
                        ],
                      });
                      setApproveSpender("");
                      setApproveAmount("");
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Approve
                </button>
              </div>
            </div>

            <hr className="cyber-divider my-4" />

            <p className="cyber-label mb-3">Check Balance</p>
            <AddressInput
              value={accountBalanceOf}
              onChange={value => setAccountBalanceOf(value)}
              placeholder="Address to check"
            />
            {balanceOfWrite !== undefined && (
              <div
                className="mt-3 px-4 py-2 rounded"
                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}
              >
                <span className="cyber-label">$BAL Balance: </span>
                <span className="cyber-value">{parseFloat(formatEther(balanceOfWrite || 0n)).toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column — curve */}
        <div className="lg:sticky lg:top-24 flex justify-center items-start pt-2">
          <div className="cyber-card p-4 w-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff]"></span>
              <span className="cyber-label">Price Curve (x · y = k)</span>
            </div>
            <div ref={curveWrapRef} className="flex justify-center w-full min-w-0">
              <Curve
                addingEth={ethToTokenAmount !== "" ? parseFloat(ethToTokenAmount.toString()) : 0}
                addingToken={tokenToETHAmount !== "" ? parseFloat(tokenToETHAmount.toString()) : 0}
                ethReserve={parseFloat(formatEther(contractETHBalance?.value || 0n))}
                tokenReserve={parseFloat(formatEther(contractBalance || 0n))}
                width={curveSize}
                height={curveSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dex;
