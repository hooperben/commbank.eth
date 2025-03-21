"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const isDark = theme === "dark";

    // Set canvas dimensions
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = (Math.random() * canvas.width) / window.devicePixelRatio;
        this.y = (Math.random() * canvas.height) / window.devicePixelRatio;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;

        // Yellow-orange gradient colors
        const hue = 35 + Math.random() * 15;
        const saturation = 80 + Math.random() * 20;
        const lightness = isDark
          ? 40 + Math.random() * 20
          : 70 + Math.random() * 20;
        this.color = `hsla(${hue}, ${saturation}%, ${lightness}%, `;
        this.alpha = 0.1 + Math.random() * 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.2) this.size -= 0.01;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width / window.devicePixelRatio) {
          this.speedX = -this.speedX;
        }

        if (this.y < 0 || this.y > canvas.height / window.devicePixelRatio) {
          this.speedY = -this.speedY;
        }
      }

      draw() {
        ctx.fillStyle = this.color + this.alpha + ")";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const numberOfParticles = Math.min(
        Math.floor((canvas.width * canvas.height) / 15000),
        100,
      );

      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    initParticles();

    // Connect particles with lines
    const connectParticles = () => {
      const maxDistance = 150;

      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = 1 - distance / maxDistance;
            const hue = 35 + Math.random() * 15;
            const saturation = 80 + Math.random() * 20;
            const lightness = isDark ? 40 : 70;

            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${
              opacity * 0.5
            })`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      connectParticles();

      // Replace particles that are too small
      particles = particles.map((particle) => {
        if (particle.size <= 0.2) {
          return new Particle();
        }
        return particle;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
