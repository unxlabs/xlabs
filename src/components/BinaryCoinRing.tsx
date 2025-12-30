import { useEffect, useMemo, useRef } from "react";

type Props = {
  /** النص اللي بدك يطلع بالنص (بدل ₿ ممكن تحط X مثلاً) */
  symbol?: string;
  /** السلسلة الثنائية اللي بدك تتكرر */
  binary?: string;
  /** سرعة حركة الأرقام */
  speed?: number; // 1 = normal
  /** كثافة الأرقام */
  density?: number; // 1 = normal
  /** تدوير الحلقة */
  spin?: number; // 1 = normal
};

type StreamParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  char: string;
  size: number;
  hue: "cyan" | "amber";
};

export default function BinaryCoinRing({
  symbol = "₿",
  binary = "010101100110",
  speed = 1,
  density = 1,
  spin = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<StreamParticle[]>([]);
  const tRef = useRef(0);

  const binChars = useMemo(() => (binary.trim().length ? binary.trim().split("") : "01".split("")), [binary]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      w = Math.max(320, Math.floor(rect.width));
      h = Math.max(240, Math.floor(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    const drawGlowLine = (x1: number, y1: number, x2: number, y2: number, color: string, glow = 14, width = 2) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    const drawNode = (x: number, y: number, color: string, r = 5) => {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.35, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBackdrop = () => {
      // خلفية سودا + هالات
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      const rad1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
      rad1.addColorStop(0, "rgba(8,230,254,0.10)");
      rad1.addColorStop(0.45, "rgba(217,85,254,0.06)");
      rad1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, w, h);

      // vignette
      const vig = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.1, cx, cy, Math.max(w, h) * 0.6);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    };

    const drawRing = (time: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.28;

      // outer ring (gradient-ish)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.25 * spin);

      const lg = ctx.createLinearGradient(-R, 0, R, 0);
      lg.addColorStop(0, "rgba(8,230,254,0.95)");
      lg.addColorStop(0.48, "rgba(9,129,254,0.85)");
      lg.addColorStop(1, "rgba(255,170,40,0.95)");

      ctx.strokeStyle = lg;
      ctx.lineWidth = Math.max(10, R * 0.12);
      ctx.shadowColor = "rgba(8,230,254,0.35)";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // inner rings + dashes
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-time * 0.15 * spin);

      for (let i = 0; i < 4; i++) {
        const r = R * (0.72 - i * 0.09);
        ctx.setLineDash([10 + i * 4, 14 + i * 6]);
        ctx.lineDashOffset = -time * (60 + i * 18);
        ctx.strokeStyle = i % 2 === 0 ? "rgba(8,230,254,0.30)" : "rgba(255,170,40,0.26)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.restore();
    };

    const drawCircuitArms = () => {
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.28;

      const leftX = cx - R * 1.55;
      const rightX = cx + R * 1.55;

      // left arm
      drawGlowLine(leftX, cy - 60, cx - R * 0.95, cy - 30, "rgba(8,230,254,0.75)", 16, 2);
      drawGlowLine(leftX, cy, cx - R * 0.95, cy, "rgba(8,230,254,0.65)", 16, 2);
      drawGlowLine(leftX, cy + 60, cx - R * 0.95, cy + 30, "rgba(8,230,254,0.55)", 14, 2);

      drawNode(leftX, cy - 60, "rgba(8,230,254,0.85)", 4);
      drawNode(leftX, cy, "rgba(8,230,254,0.85)", 5);
      drawNode(leftX, cy + 60, "rgba(8,230,254,0.80)", 4);

      // right arm
      drawGlowLine(cx + R * 0.95, cy - 30, rightX, cy - 60, "rgba(255,170,40,0.75)", 16, 2);
      drawGlowLine(cx + R * 0.95, cy, rightX, cy, "rgba(255,170,40,0.65)", 16, 2);
      drawGlowLine(cx + R * 0.95, cy + 30, rightX, cy + 60, "rgba(255,170,40,0.55)", 14, 2);

      drawNode(rightX, cy - 60, "rgba(255,170,40,0.85)", 4);
      drawNode(rightX, cy, "rgba(255,170,40,0.85)", 5);
      drawNode(rightX, cy + 60, "rgba(255,170,40,0.80)", 4);
    };

    const drawCenterCoin = (time: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.16;

      // coin base (glass/metal)
      ctx.save();
      const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 1.2);
      g.addColorStop(0, "rgba(255,255,255,0.12)");
      g.addColorStop(0.35, "rgba(4,16,34,0.92)");
      g.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // coin rim glow
      const rim = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      rim.addColorStop(0, "rgba(8,230,254,0.85)");
      rim.addColorStop(1, "rgba(255,170,40,0.85)");
      ctx.strokeStyle = rim;
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(255,255,255,0.14)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // subtle inner circuits (rings)
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      for (let i = 0; i < 4; i++) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r * (0.26 + i * 0.14), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // symbol
      ctx.save();
      ctx.font = `900 ${Math.floor(r * 1.05)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      textGrad.addColorStop(0, "rgba(8,230,254,1)");
      textGrad.addColorStop(0.55, "rgba(9,129,254,1)");
      textGrad.addColorStop(1, "rgba(255,170,40,1)");

      ctx.shadowColor = "rgba(8,230,254,0.35)";
      ctx.shadowBlur = 22 + 8 * Math.sin(time * 2);
      ctx.fillStyle = textGrad;
      ctx.fillText(symbol, cx, cy + 2);

      // highlight stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.strokeText(symbol, cx, cy + 2);

      ctx.restore();
      ctx.restore();
    };

    const spawnBinary = () => {
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.28;

      const leftSpawnX = cx - R * 1.55;
      const rightSpawnX = cx + R * 1.55;

      const lanes = [
        { x: leftSpawnX, y: cy - 60, hue: "cyan" as const, tx: cx - R * 0.55, ty: cy - 22 },
        { x: leftSpawnX, y: cy, hue: "cyan" as const, tx: cx - R * 0.55, ty: cy },
        { x: leftSpawnX, y: cy + 60, hue: "cyan" as const, tx: cx - R * 0.55, ty: cy + 22 },
        { x: rightSpawnX, y: cy - 60, hue: "amber" as const, tx: cx + R * 0.55, ty: cy - 22 },
        { x: rightSpawnX, y: cy, hue: "amber" as const, tx: cx + R * 0.55, ty: cy },
        { x: rightSpawnX, y: cy + 60, hue: "amber" as const, tx: cx + R * 0.55, ty: cy + 22 },
      ];

      // عدد السبونات حسب الكثافة
      const count = Math.floor(2 * density + rand(0, 2));

      for (let i = 0; i < count; i++) {
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const char = binChars[Math.floor(Math.random() * binChars.length)] ?? "0";

        // اتجاه نحو نقطة قبل المركز، بعدين تكمل للمركز بالانجذاب
        const dx = lane.tx - lane.x;
        const dy = lane.ty - lane.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len;
        const uy = dy / len;

        const baseV = rand(1.8, 3.6) * speed;

        particlesRef.current.push({
          x: lane.x + rand(-6, 6),
          y: lane.y + rand(-6, 6),
          vx: ux * baseV,
          vy: uy * baseV,
          life: 0,
          maxLife: rand(75, 140),
          char,
          size: rand(14, 20),
          hue: lane.hue,
        });
      }
    };

    const updateAndDrawBinary = () => {
      const cx = w / 2;
      const cy = h / 2;

      // spawn cadence
      if (Math.random() < 0.55 * density) spawnBinary();

      const arr = particlesRef.current;
      const keep: StreamParticle[] = [];

      for (const p of arr) {
        p.life += 1;

        // mild attraction to center (so it feels like “entering the coin”)
        const ax = (cx - p.x) * 0.0009 * speed;
        const ay = (cy - p.y) * 0.0009 * speed;
        p.vx += ax;
        p.vy += ay;

        // damping
        p.vx *= 0.992;
        p.vy *= 0.992;

        p.x += p.vx;
        p.y += p.vy;

        const dist = Math.hypot(cx - p.x, cy - p.y);

        // fade logic
        const t = clamp01(p.life / p.maxLife);
        const a = (1 - t) * (dist < Math.min(w, h) * 0.16 ? 0.2 : 1);

        // draw
        const color = p.hue === "cyan" ? "rgba(8,230,254," : "rgba(255,170,40,";
        ctx.save();
        ctx.font = `700 ${Math.floor(p.size)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = p.hue === "cyan" ? "rgba(8,230,254,0.85)" : "rgba(255,170,40,0.85)";
        ctx.shadowBlur = 18;

        ctx.fillStyle = `${color}${Math.max(0, a * 0.85)})`;
        ctx.fillText(p.char, p.x, p.y);

        // tiny core highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, a * 0.25)})`;
        ctx.fillText(p.char, p.x + 0.6, p.y - 0.6);

        ctx.restore();

        // keep if alive and not too close (simulate entering coin)
        if (p.life < p.maxLife && dist > Math.min(w, h) * 0.11) keep.push(p);
      }

      particlesRef.current = keep;
    };

    const frame = () => {
      const time = (tRef.current += 1 / 60);

      drawBackdrop();
      drawCircuitArms();
      drawRing(time);
      updateAndDrawBinary();
      drawCenterCoin(time);

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [binChars, density, speed, spin, symbol]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
