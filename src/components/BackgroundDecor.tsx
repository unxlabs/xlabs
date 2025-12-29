export default function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Cyan blob */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          left: "-280px",
          top: "-260px",
          borderRadius: 9999,
          background: "radial-gradient(circle at 35% 35%, rgba(8,230,254,0.22), transparent 60%)",
          filter: "blur(12px)",
          opacity: 0.9,
        }}
      />

      {/* Blue blob */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          right: "-300px",
          top: "-220px",
          borderRadius: 9999,
          background: "radial-gradient(circle at 45% 35%, rgba(9,129,254,0.18), transparent 60%)",
          filter: "blur(12px)",
          opacity: 0.9,
        }}
      />

      {/* Magenta blob */}
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          left: "35%",
          bottom: "-520px",
          borderRadius: 9999,
          background: "radial-gradient(circle at 50% 40%, rgba(217,85,254,0.16), transparent 60%)",
          filter: "blur(12px)",
          opacity: 0.9,
        }}
      />

      {/* soft vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 600px at 50% 25%, rgba(0,0,0,0), rgba(0,0,0,0.55))",
          opacity: 0.75,
        }}
      />
    </div>
  );
}
