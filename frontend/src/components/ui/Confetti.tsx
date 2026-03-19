import { useEffect, useRef } from "react";

const COLORS = ["#8b7a9e", "#5c8f6a", "#9a98b5", "#a39e72", "#d4a843", "#e8738a"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "square" | "circle" | "strip";
}

interface ConfettiProps {
  intensity?: "small" | "big";
  trigger: boolean;
}

export default function Confetti({ intensity = "small", trigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use full viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = intensity === "big" ? 60 : 30;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const shapes: Particle["shape"][] = ["square", "circle", "strip"];
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.4,
        y: canvas.height * 0.35,
        vx: (Math.random() - 0.5) * (intensity === "big" ? 14 : 9),
        vy: -(Math.random() * (intensity === "big" ? 16 : 10) + 3),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    const startTime = performance.now();
    const duration = intensity === "big" ? 2500 : 1800;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.35; // gravity
        p.y += p.vy;
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - progress * 1.1);

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;

        if (p.shape === "square") {
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "circle") {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          ctx!.fillRect(-p.size / 2, -1.5, p.size, 3);
        }

        ctx!.restore();
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [trigger, intensity]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
