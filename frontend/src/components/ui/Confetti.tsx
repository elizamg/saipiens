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
  /** "small" for correct answer, "big" for unit/challenge completion */
  intensity?: "small" | "big";
  /** Set to true to trigger a burst */
  trigger: boolean;
}

export default function Confetti({ intensity = "small", trigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (!trigger || prevTrigger.current === trigger) return;
    prevTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width ?? 400;
    canvas.height = rect?.height ?? 400;

    const count = intensity === "big" ? 60 : 30;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const shapes: Particle["shape"][] = ["square", "circle", "strip"];
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
        y: canvas.height * 0.3,
        vx: (Math.random() - 0.5) * (intensity === "big" ? 12 : 8),
        vy: -(Math.random() * (intensity === "big" ? 14 : 8) + 2),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    let startTime = performance.now();
    const duration = intensity === "big" ? 2500 : 1800;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.3; // gravity
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - progress * 1.2);

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
          ctx!.fillRect(-p.size / 2, -1, p.size, 2.5);
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

  // Reset trigger tracking when trigger goes back to false
  useEffect(() => {
    if (!trigger) prevTrigger.current = false;
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
}
