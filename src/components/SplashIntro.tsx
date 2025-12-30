import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  onDone: () => void;
  title?: string;
  subtitle?: string;
  durationMs?: number;
};

export default function SplashIntro({
  onDone,
  title = "UNLIMITED",
  subtitle = "X LABS",
  durationMs = 2100,
}: Props) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const ms = reduceMotion ? 350 : durationMs;
    const t = window.setTimeout(() => onDone(), ms);
    return () => window.clearTimeout(t);
  }, [durationMs, onDone, reduceMotion]);

  // timings
  const t0 = reduceMotion ? 0 : 0.05;
  const t1 = reduceMotion ? 0 : 0.22;
  const t2 = reduceMotion ? 0 : 0.42;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.45 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
          overflow: "hidden",
          background:
            "radial-gradient(1200px 700px at 30% 35%, rgba(9,129,254,0.18), transparent 60%)," +
            "radial-gradient(1100px 750px at 70% 65%, rgba(217,85,254,0.16), transparent 60%)," +
            "linear-gradient(180deg, rgba(2,8,20,0.96), rgba(2,8,20,0.96))",
        }}
      >
        {/* soft moving haze */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0.55, scale: 1 }}
          animate={
            reduceMotion
              ? { opacity: 0.55 }
              : { opacity: [0.45, 0.62, 0.48], scale: [1, 1.06, 1.02] }
          }
          transition={reduceMotion ? undefined : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: "-20%",
            background:
              "radial-gradient(700px 400px at 25% 40%, rgba(8,230,254,0.11), transparent 60%)," +
              "radial-gradient(650px 420px at 75% 60%, rgba(217,85,254,0.09), transparent 60%)," +
              "radial-gradient(520px 360px at 55% 30%, rgba(9,129,254,0.08), transparent 60%)",
            filter: "blur(18px)",
          }}
        />

        {/* grid / circuit lines */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: reduceMotion ? 0.12 : 0.18 }}
          transition={{ duration: 0.6 }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(252,253,253,0.05) 1px, transparent 1px)," +
              "linear-gradient(to bottom, rgba(252,253,253,0.05) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(circle at 50% 45%, black 0%, transparent 70%)",
          }}
        />

        {/* scanline */}
        <motion.div
          aria-hidden
          initial={{ y: "-120%" }}
          animate={reduceMotion ? { opacity: 0 } : { y: "120%" }}
          transition={reduceMotion ? undefined : { duration: 1.25, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 160,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(8,230,254,0.10) 40%, rgba(217,85,254,0.08) 60%, transparent 100%)",
            filter: "blur(1px)",
            opacity: 0.9,
          }}
        />

        {/* noise film grain */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            mixBlendMode: "overlay",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
          }}
        />

        {/* content */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: 18 }}>
          {/* neon ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.8, ease: "easeOut" }}
            style={{
              width: 210,
              height: 210,
              borderRadius: 999,
              margin: "0 auto 18px",
              background:
                "radial-gradient(circle at 30% 30%, rgba(8,230,254,0.18), transparent 55%)," +
                "radial-gradient(circle at 70% 70%, rgba(217,85,254,0.14), transparent 55%)",
              boxShadow:
                "0 0 44px rgba(8,230,254,0.16), 0 0 70px rgba(217,85,254,0.10), inset 0 0 30px rgba(252,253,253,0.05)",
              border: "1px solid rgba(252,253,253,0.10)",
              position: "relative",
            }}
          >
            {/* orbit dots */}
            {!reduceMotion && (
              <motion.div
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
                style={{ position: "absolute", inset: 0 }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: "50%",
                    width: 10,
                    height: 10,
                    transform: "translateX(-50%)",
                    borderRadius: 99,
                    background: "rgba(8,230,254,0.85)",
                    boxShadow: "0 0 18px rgba(8,230,254,0.35)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 18,
                    left: "20%",
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: "rgba(217,85,254,0.78)",
                    boxShadow: "0 0 18px rgba(217,85,254,0.28)",
                  }}
                />
              </motion.div>
            )}
          </motion.div>

          {/* glitch title */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: "easeOut", delay: t0 }}
            style={{
              display: "inline-block",
              position: "relative",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              fontSize: "clamp(22px, 4.8vw, 38px)",
              color: "rgba(252,253,253,0.92)",
              textShadow: "0 0 30px rgba(8,230,254,0.18)",
              paddingLeft: 8,
            }}
          >
            {/* pseudo glitch layers */}
            {!reduceMotion && (
              <>
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1, 0] }}
                  transition={{ duration: 0.9, delay: 0.08 }}
                  style={{
                    position: "absolute",
                    left: 2,
                    top: 0,
                    color: "rgba(8,230,254,0.65)",
                    filter: "blur(0.2px)",
                    mixBlendMode: "screen",
                  }}
                >
                  {title}
                </motion.span>
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1, 0] }}
                  transition={{ duration: 0.9, delay: 0.11 }}
                  style={{
                    position: "absolute",
                    left: -2,
                    top: 0,
                    color: "rgba(217,85,254,0.55)",
                    filter: "blur(0.2px)",
                    mixBlendMode: "screen",
                  }}
                >
                  {title}
                </motion.span>
              </>
            )}

            <span style={{ color: "var(--cyan)" }}>{title}</span>
          </motion.div>

          {/* subtitle */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: "easeOut", delay: t1 }}
            style={{
              marginTop: 10,
              fontSize: "clamp(12px, 2.6vw, 14px)",
              fontWeight: 800,
              letterSpacing: "0.42em",
              color: "rgba(252,253,253,0.78)",
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </motion.div>

          {/* shimmer line */}
          <motion.div
            initial={{ opacity: 0, width: 70 }}
            animate={{ opacity: 1, width: "min(420px, 78vw)" }}
            transition={{ duration: reduceMotion ? 0.25 : 0.8, ease: "easeOut", delay: t2 }}
            style={{
              height: 1,
              margin: "18px auto 0",
              background:
                "linear-gradient(90deg, transparent, rgba(8,230,254,0.55), rgba(217,85,254,0.38), rgba(9,129,254,0.42), transparent)",
              boxShadow: "0 0 24px rgba(8,230,254,0.12)",
            }}
          />

          {/* tiny status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: reduceMotion ? 0.7 : 0.8 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.55 }}
            style={{
              marginTop: 14,
              fontSize: 12,
              letterSpacing: "0.16em",
              color: "rgba(252,253,253,0.55)",
              textTransform: "uppercase",
            }}
          >
            Initializing Mainnet Experience…
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
