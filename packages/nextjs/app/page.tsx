"use client";

import Image from "next/image";
import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { ArrowRightIcon, ChartBarIcon, CurrencyDollarIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-cyan-900/20" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
              <SparklesIcon className="w-4 h-4" />
              <span>SpeedRun Ethereum Challenge</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Build a DEX
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12">
              A decentralized exchange powered by the constant product formula. Swap ETH ↔ $BAL tokens with automatic
              price discovery.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/dex"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold hover:from-violet-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105"
              >
                <CurrencyDollarIcon className="w-5 h-5" />
                Launch DEX
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/debug"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all duration-200"
              >
                <ChartBarIcon className="w-5 h-5" />
                Debug Contracts
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-bold text-cyan-400 mb-2">0.3%</div>
                <div className="text-gray-400">Trading Fee</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-bold text-violet-400 mb-2">x * y = k</div>
                <div className="text-gray-400">Constant Product</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-bold text-green-400 mb-2">AMM</div>
                <div className="text-gray-400">Automated Market Maker</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          <span className="text-white">How it </span>
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-violet-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CurrencyDollarIcon className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Swap Tokens</h3>
            <p className="text-gray-400">
              Exchange ETH for $BAL tokens instantly. The price automatically adjusts based on pool reserves using the
              constant product formula.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-cyan-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ChartBarIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Provide Liquidity</h3>
            <p className="text-gray-400">
              Add both ETH and tokens to the pool. Earn 0.3% on every trade. Your contribution enables decentralized
              trading for everyone.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-green-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <SparklesIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Earn Fees</h3>
            <p className="text-gray-400">
              Liquidity providers earn a share of every trade. Withdraw your tokens plus accumulated fees anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Connected Address */}
      {connectedAddress && (
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto">
            <p className="text-gray-400 text-sm mb-2">Your Address</p>
            <Address
              address={connectedAddress}
              chain={targetNetwork}
              blockExplorerAddressLink={
                targetNetwork.id === hardhat.id ? `/blockexplorer/address/${connectedAddress}` : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
