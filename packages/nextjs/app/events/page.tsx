"use client";

import { useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import Boom from "react-confetti-boom";

const shortAddress = (address?: string) => {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const toAmount = (value?: bigint) => Number.parseFloat(formatEther(value ?? 0n)).toFixed(4);

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

const Events: NextPage = () => {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: (i * 17 + 13) % 100,
        top: (i * 11 + 19) % 100,
        size: 2 + (i % 4),
        delay: (i % 7) * 0.7,
        duration: 7 + (i % 6) * 1.5,
        opacity: 0.1 + (i % 5) * 0.08,
      })),
    [],
  );

  const [showConfetti, setShowConfetti] = useState(false);
  const [prevEventCount, setPrevEventCount] = useState(0);

  const { data: ethToTokenEvents, isLoading: isEthToTokenEventsLoading } = useScaffoldEventHistory({
    contractName: "DEX",
    eventName: "EthToTokenSwap",
  });

  const { data: tokenToEthEvents, isLoading: isTokenToEthEventsLoading } = useScaffoldEventHistory({
    contractName: "DEX",
    eventName: "TokenToEthSwap",
  });

  const { data: liquidityProvidedEvents, isLoading: isLiquidityProvidedEventsLoading } = useScaffoldEventHistory({
    contractName: "DEX",
    eventName: "LiquidityProvided",
  });

  const { data: liquidityRemovedEvents, isLoading: isLiquidityRemovedEventsLoading } = useScaffoldEventHistory({
    contractName: "DEX",
    eventName: "LiquidityRemoved",
  });

  // Calculate total events and trigger confetti when new events arrive
  const totalEvents = useMemo(() => {
    return (
      (ethToTokenEvents?.length || 0) +
      (tokenToEthEvents?.length || 0) +
      (liquidityProvidedEvents?.length || 0) +
      (liquidityRemovedEvents?.length || 0)
    );
  }, [ethToTokenEvents, tokenToEthEvents, liquidityProvidedEvents, liquidityRemovedEvents]);

  useEffect(() => {
    if (totalEvents > prevEventCount && prevEventCount > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setPrevEventCount(totalEvents);
  }, [totalEvents, prevEventCount]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {showConfetti && (
        <Boom
          height={300}
          angle={130}
          spread={360}
          particleCount={100}
          colors={["#49a3ff", "#1dd3c7", "#ff9f6e", "#ff6aa0", "#8f9bff"]}
        />
      )}
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
          <h1 className="text-4xl sm:text-5xl font-semibold text-[#f7fbff]">DEX Events</h1>
          <p className="text-[#c5d7f4] mt-2">Live activity feed for swaps and liquidity actions.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section className="rounded-3xl border border-white/15 bg-[#0f1726]/95 p-5">
            <h2 className="text-[#f7fbff] text-lg font-semibold mb-3">ETH to BAL Swaps</h2>
            {isEthToTokenEventsLoading ? (
              <div className="py-6 text-[#9cb2d2]">Loading events...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/15">
                <table className="w-full text-sm">
                  <thead className="bg-[#162238] text-[#9fc3f5]">
                    <tr>
                      <th className="text-left p-3">Swapper</th>
                      <th className="text-right p-3">ETH In</th>
                      <th className="text-right p-3">BAL Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!ethToTokenEvents || ethToTokenEvents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-[#9cb2d2]">
                          No events found
                        </td>
                      </tr>
                    ) : (
                      ethToTokenEvents.map((event, index) => (
                        <tr key={index} className="border-t border-white/10 text-[#e6efff]">
                          <td className="p-3 font-mono">{shortAddress(event.args?.swapper)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.ethInput)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.tokenOutput)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/15 bg-[#0f1726]/95 p-5">
            <h2 className="text-[#f7fbff] text-lg font-semibold mb-3">BAL to ETH Swaps</h2>
            {isTokenToEthEventsLoading ? (
              <div className="py-6 text-[#9cb2d2]">Loading events...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/15">
                <table className="w-full text-sm">
                  <thead className="bg-[#162238] text-[#9fc3f5]">
                    <tr>
                      <th className="text-left p-3">Swapper</th>
                      <th className="text-right p-3">BAL In</th>
                      <th className="text-right p-3">ETH Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!tokenToEthEvents || tokenToEthEvents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-[#9cb2d2]">
                          No events found
                        </td>
                      </tr>
                    ) : (
                      tokenToEthEvents.map((event, index) => (
                        <tr key={index} className="border-t border-white/10 text-[#e6efff]">
                          <td className="p-3 font-mono">{shortAddress(event.args?.swapper)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.tokensInput)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.ethOutput)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/15 bg-[#0f1726]/95 p-5">
            <h2 className="text-[#f7fbff] text-lg font-semibold mb-3">Liquidity Provided</h2>
            {isLiquidityProvidedEventsLoading ? (
              <div className="py-6 text-[#9cb2d2]">Loading events...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/15">
                <table className="w-full text-sm">
                  <thead className="bg-[#162238] text-[#9fc3f5]">
                    <tr>
                      <th className="text-left p-3">Provider</th>
                      <th className="text-right p-3">ETH In</th>
                      <th className="text-right p-3">BAL In</th>
                      <th className="text-right p-3">LP Minted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!liquidityProvidedEvents || liquidityProvidedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-[#9cb2d2]">
                          No events found
                        </td>
                      </tr>
                    ) : (
                      liquidityProvidedEvents.map((event, index) => (
                        <tr key={index} className="border-t border-white/10 text-[#e6efff]">
                          <td className="p-3 font-mono">{shortAddress(event.args?.liquidityProvider)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.ethInput)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.tokensInput)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.liquidityMinted)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/15 bg-[#0f1726]/95 p-5">
            <h2 className="text-[#f7fbff] text-lg font-semibold mb-3">Liquidity Removed</h2>
            {isLiquidityRemovedEventsLoading ? (
              <div className="py-6 text-[#9cb2d2]">Loading events...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/15">
                <table className="w-full text-sm">
                  <thead className="bg-[#162238] text-[#9fc3f5]">
                    <tr>
                      <th className="text-left p-3">Remover</th>
                      <th className="text-right p-3">ETH Out</th>
                      <th className="text-right p-3">BAL Out</th>
                      <th className="text-right p-3">LP Burned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!liquidityRemovedEvents || liquidityRemovedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-[#9cb2d2]">
                          No events found
                        </td>
                      </tr>
                    ) : (
                      liquidityRemovedEvents.map((event, index) => (
                        <tr key={index} className="border-t border-white/10 text-[#e6efff]">
                          <td className="p-3 font-mono">{shortAddress(event.args?.liquidityRemover)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.ethOutput)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.tokenOutput)}</td>
                          <td className="p-3 text-right">{toAmount(event.args?.liquidityAmount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
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

export default Events;
