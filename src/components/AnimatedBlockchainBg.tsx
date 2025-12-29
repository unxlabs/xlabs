import { useEffect, useRef } from "react";

type Pt = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: "node" | "block";
  tone: "cyan" | "magenta" | "blue";
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function AnimatedBlockchainBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // ✅ Guard once
    if (!canvasRef.current) return;

    // ✅ After guard, force non-null (TS-safe)
    const canvasEl = canvasRef.current!;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const c = ctx;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const mouse = { x: 0, y: 0, active: false };
    const pts: Pt[] = [];

    let raf = 0;
    let last = performance.now();

    function rebuildParticles() {
      pts.length = 0;

      const area = w * h;
      const nodeCount = clamp(Math.floor(area / 22000), 26, 75);
      const blockCount = clamp(Math.floor(area / 140000), 5, 14);

      for (let i = 0; i < nodeCount; i++) {
        pts.push({
          x: rand(0, w),
          y: rand(0, h),
          vx: rand(-0.22, 0.22),
          vy: rand(-0.18, 0.18),
          r: rand(1.2, 2.2),
          kind: "node",
          tone: Math.random() < 0.45 ? "cyan" : Math.random() < 0.7 ? "blue" : "magenta",
        });
      }

      for (let i = 0; i < blockCount; i++) {
        pts.push({
          x: rand(0, w),
          y: rand(0, h),
          vx: rand(-0.12, 0.12),
          vy: rand(-0.1, 0.1),
          r: rand(5.5, 10.0),
          kind: "block",
          tone: Math.random() < 0.5 ? "cyan" : "magenta",
        });
      }
    }

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      canvasEl.width = Math.floor(w * dpr);
      canvasEl.height = Math.floor(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      rebuildParticles();
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvasEl.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }

    function onMouseLeave() {
      mouse.active = false;
    }

    function step(now: number) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      c.clearRect(0, 0, w, h);

      // haze
      c.save();
      c.globalAlpha = 0.22;

      const g1 = c.createRadialGradient(
        w * 0.35,
        h * 0.35,
        0,
        w * 0.35,
        h * 0.35,
        Math.min(w, h) * 0.7
      );
      g1.addColorStop(0, "rgba(9,129,254,0.12)");
      g1.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g1;
      c.fillRect(0, 0, w, h);

      const g2 = c.createRadialGradient(
        w * 0.68,
        h * 0.62,
        0,
        w * 0.68,
        h * 0.62,
        Math.min(w, h) * 0.8
      );
      g2.addColorStop(0, "rgba(217,85,254,0.10)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g2;
      c.fillRect(0, 0, w, h);

      c.restore();

      // motion
      for (const p of pts) {
        if (!reduceMotion) {
          p.x += p.vx * 60 * dt;
          p.y += p.vy * 60 * dt;
        }

        if (mouse.active && !reduceMotion) {
          const dx = (mouse.x - w / 2) / (w / 2);
          const dy = (mouse.y - h / 2) / (h / 2);
          p.x += dx * 0.06 * (p.kind === "block" ? 0.6 : 1.0);
          p.y += dy * 0.06 * (p.kind === "block" ? 0.6 : 1.0);
        }

        if (p.x < -30) p.x = w + 30;
        if (p.x > w + 30) p.x = -30;
        if (p.y < -30) p.y = h + 30;
        if (p.y > h + 30) p.y = -30;
      }

      // connections
      const connectDist = Math.min(150, Math.max(110, Math.sqrt(w * h) / 7));
      c.save();
      c.lineWidth = 1;

      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        if (a.kind !== "node") continue;

        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          if (b.kind !== "node") continue;

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > connectDist) continue;

          const alpha = (1 - d / connectDist) * 0.28;
          const tint =
            a.tone === "magenta" || b.tone === "magenta"
              ? "rgba(217,85,254,"
              : a.tone === "cyan" || b.tone === "cyan"
              ? "rgba(8,230,254,"
              : "rgba(9,129,254,";

          c.strokeStyle = `${tint}${alpha})`;
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
      }
      c.restore();

      // blocks
      for (const p of pts) {
        if (p.kind !== "block") continue;

        const s = p.r;
        const d = s * 0.55;
        const hCube = s * 0.62;

        c.save();
        c.globalAlpha = 0.22;
        c.shadowBlur = 18;
        c.shadowColor = p.tone === "cyan" ? "rgba(8,230,254,0.40)" : "rgba(217,85,254,0.28)";
        c.lineWidth = 1.2;
        c.strokeStyle = p.tone === "cyan" ? "rgba(8,230,254,0.40)" : "rgba(217,85,254,0.34)";

        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x + d, p.y - d);
        c.lineTo(p.x + d + s, p.y - d);
        c.lineTo(p.x + s, p.y);
        c.closePath();
        c.stroke();

        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x + s, p.y);
        c.lineTo(p.x + s, p.y + hCube);
        c.lineTo(p.x, p.y + hCube);
        c.closePath();
        c.stroke();

        c.beginPath();
        c.moveTo(p.x + s, p.y);
        c.lineTo(p.x + d + s, p.y - d);
        c.lineTo(p.x + d + s, p.y - d + hCube);
        c.lineTo(p.x + s, p.y + hCube);
        c.closePath();
        c.stroke();

        c.restore();
      }

      // nodes
      for (const p of pts) {
        if (p.kind !== "node") continue;

        c.save();
        c.shadowBlur = 16;
        c.shadowColor =
          p.tone === "cyan"
            ? "rgba(8,230,254,0.30)"
            : p.tone === "magenta"
            ? "rgba(217,85,254,0.22)"
            : "rgba(9,129,254,0.22)";

        c.globalAlpha = 0.55;
        c.fillStyle =
          p.tone === "cyan"
            ? "rgba(8,230,254,0.85)"
            : p.tone === "magenta"
            ? "rgba(217,85,254,0.75)"
            : "rgba(9,129,254,0.75)";

        c.beginPath();
        c.arc(p.x, p.y, p.r + 2.2, 0, Math.PI * 2);
        c.fill();

        c.shadowBlur = 0;
        c.fillStyle = "rgba(252,253,253,0.45)";
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
