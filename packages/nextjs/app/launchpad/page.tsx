"use client";

import type { NextPage } from "next";
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

// Mock data for Upcoming IDOs
const upcomingIDOs = [
  {
    id: 1,
    name: "Nebula Protocol",
    symbol: "NEB",
    description: "Next-gen DeFi aggregation platform",
    raised: 2450000,
    target: 5000000,
    participants: 1240,
    endsIn: "4 days",
    image: "🌌",
  },
  {
    id: 2,
    name: "Quantum Finance",
    symbol: "QTF",
    description: "AI-powered yield farming optimizer",
    raised: 1800000,
    target: 3000000,
    participants: 890,
    endsIn: "7 days",
    image: "⚛️",
  },
  {
    id: 3,
    name: "Apex Launch",
    symbol: "APEX",
    description: "Cross-chain launchpad ecosystem",
    raised: 3200000,
    target: 4000000,
    participants: 2100,
    endsIn: "2 days",
    image: "🚀",
  },
];

// Mock data for Completed Projects
const completedProjects = [
  {
    id: 1,
    name: "Solaris DEX",
    symbol: "SOL",
    chain: "BSC",
    price: "$2.45",
    change: "+145%",
    date: "2024-01-15",
  },
  {
    id: 2,
    name: "Ether Vault",
    symbol: "EVT",
    chain: "ETH",
    price: "$1.82",
    change: "+82%",
    date: "2024-02-20",
  },
  {
    id: 3,
    name: "Solana Star",
    symbol: "STAR",
    chain: "SOL",
    price: "$0.95",
    change: "-5%",
    date: "2024-03-10",
  },
];

// Stats data
const stats = [
  { label: "Total Raised", value: "$12.4M", icon: CurrencyDollarIcon },
  { label: "Active Investors", value: "8,450", icon: UsersIcon },
  { label: "Projects Launched", value: "24", icon: RocketLaunchIcon },
  { label: "Success Rate", value: "96%", icon: ShieldCheckIcon },
];

const Launchpad: NextPage = () => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K";
    }
    return num.toString();
  };

  const getChainIcon = (chain: string) => {
    switch (chain) {
      case "BSC":
        return "🔶";
      case "ETH":
        return "◈";
      case "SOL":
        return "◎";
      default:
        return "●";
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#050b15" }}>
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dark Purple Radial Gradient */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)",
            top: "-200px",
            left: "-200px",
          }}
        />
        {/* Teal Radial Gradient */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, rgba(20, 184, 166, 0) 70%)",
            bottom: "-100px",
            right: "-100px",
          }}
        />
        {/* Cyan accent gradient */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(0, 242, 255, 0.3) 0%, rgba(0, 242, 255, 0) 70%)",
            top: "40%",
            right: "20%",
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div
            className="rounded-2xl p-8 md:p-12 border border-white/10"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Web3 Launchpad
              </h1>
              <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-6">
                Discover and invest in the next generation of decentralized projects. Secure, transparent, and
                community-driven IDO platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #00f2ff 0%, #00c4ff 100%)",
                    boxShadow: "0 0 20px rgba(0, 242, 255, 0.4)",
                  }}
                >
                  <span className="text-gray-900">Explore IDOs</span>
                </button>
                <button className="px-8 py-3 rounded-lg font-semibold border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300">
                  Launch Project
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl p-6 border border-white/10 text-center"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: "#00f2ff" }} />
                <p className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming IDOs Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Upcoming IDOs</h2>
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2">
              View All <ArrowTrendingUpIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingIDOs.map(ido => {
              const progressPercent = (ido.raised / ido.target) * 100;
              return (
                <div
                  key={ido.id}
                  className="rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Glow Border Top */}
                  <div
                    className="h-1"
                    style={{
                      background: "linear-gradient(90deg, #00f2ff, #8b5cf6, #00f2ff)",
                      boxShadow: "0 0 20px rgba(0, 242, 255, 0.5)",
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{ido.image}</span>
                        <div>
                          <h3 className="text-lg font-bold text-white">{ido.name}</h3>
                          <span className="text-cyan-400 text-sm">{ido.symbol}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        <ClockIcon className="w-3 h-3 inline mr-1" />
                        {ido.endsIn}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{ido.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Raised</span>
                        <span className="text-cyan-400 font-medium">${formatNumber(ido.raised)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPercent}%`,
                            background: "linear-gradient(90deg, #00f2ff, #00c4ff)",
                            boxShadow: "0 0 10px rgba(0, 242, 255, 0.5)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">{progressPercent.toFixed(0)}%</span>
                        <span className="text-gray-500">${formatNumber(ido.target)} target</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <UsersIcon className="w-4 h-4" />
                        <span>{ido.participants.toLocaleString()} participants</span>
                      </div>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-cyan-500/20"
                        style={{
                          background: "rgba(0, 242, 255, 0.1)",
                          border: "1px solid rgba(0, 242, 255, 0.3)",
                          color: "#00f2ff",
                        }}
                      >
                        Participate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Completed Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Completed Projects</h2>
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2">
              View All History <ChartBarIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {completedProjects.map(project => (
              <div
                key={project.id}
                className="rounded-xl p-4 md:p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 hover:bg-white/5"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/5 border border-white/10">
                    {getChainIcon(project.chain)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-300">{project.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">{project.chain}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-500">{project.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{project.price}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      project.change.startsWith("+") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {project.change}
                  </div>
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2024 Web3 Launchpad. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                Documentation
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Launchpad;
