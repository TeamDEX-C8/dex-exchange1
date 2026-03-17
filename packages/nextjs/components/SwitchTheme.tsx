"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

/**
 * Professional Theme Toggle Component
 * Provides smooth animated transition between light and dark themes
 * Compatible with DaisyUI themes via data-theme attribute
 */
export const SwitchTheme = ({ className }: { className?: string }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for hydration to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`h-10 w-10 skeleton rounded-lg ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-10 w-10 items-center justify-center
        rounded-lg border border-primary/30 bg-base-200/50
        hover:bg-base-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-base-100
        transition-all duration-300 ease-in-out
        ${className}
      `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="relative h-5 w-5">
        {/* Sun Icon - visible in dark mode */}
        <span
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-300 ease-in-out
            ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}
          `}
        >
          <SunIcon className="h-5 w-5 text-warning" />
        </span>

        {/* Moon Icon - visible in light mode */}
        <span
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-300 ease-in-out
            ${isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}
          `}
        >
          <MoonIcon className="h-5 w-5 text-primary" />
        </span>
      </span>

      {/* Glow effect */}
      <span
        className={`
          absolute inset-0 rounded-lg transition-opacity duration-300
          ${isDark ? "opacity-0" : "opacity-100"}
        `}
        style={{
          boxShadow: "0 0 20px rgba(0, 229, 255, 0.3), inset 0 0 10px rgba(0, 229, 255, 0.1)",
        }}
      />
    </button>
  );
};
