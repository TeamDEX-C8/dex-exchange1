"use client";

import { useEffect, useRef } from "react";

const NUM_PARTICLES = 60;
const MAX_SPEED = 0.3;
const MIN_RADIUS = 1.2;
const MAX_RADIUS = 2.8;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const BackgroundParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const initParticles = () => {
      particlesRef.current = Array.from({ length: NUM_PARTICLES }, () => ({
        x: random(0, width),
        y: random(0, height),
        vx: random(-MAX_SPEED, MAX_SPEED),
        vy: random(-MAX_SPEED, MAX_SPEED),
        r: random(MIN_RADIUS, MAX_RADIUS),
        alpha: random(0.15, 0.45),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const style = getComputedStyle(document.documentElement);
      const baseColor = style.getPropertyValue("--color-primary").trim() || "#00e5ff";
      ctx.fillStyle = baseColor;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    resize();
    initParticles();

    window.addEventListener("resize", resize);

    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 opacity-60"
      aria-hidden="true"
    />
  );
};
