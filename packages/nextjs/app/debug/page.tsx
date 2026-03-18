import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed contracts with a high-contrast fintech UI",
});

const Debug: NextPage = () => {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: (i * 21 + 7) % 100,
    top: (i * 14 + 9) % 100,
    size: 2 + (i % 3),
    delay: (i % 6) * 0.8,
    duration: 7 + (i % 5) * 1.7,
    opacity: 0.12 + (i % 4) * 0.08,
  }));

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

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 pb-12">
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-semibold text-[#f7fbff]">Debug Contracts</h1>
          <p className="text-[#c5d7f4] mt-2">Inspect and interact with deployed contracts in one place.</p>
        </div>

        <DebugContracts />
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

export default Debug;
