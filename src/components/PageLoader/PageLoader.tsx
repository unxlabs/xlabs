export default function PageLoader() {
  return (
    <div
      style={{
        minHeight: "40vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        opacity: 0.8,
      }}
      role="status"
      aria-live="polite"
    >
      Loading…
    </div>
  );
}