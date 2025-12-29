import { useAccount } from "wagmi";

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h2 className="pageTitle">Dashboard</h2>
      <p className="pageSub">Your deposits, rewards and utility status.</p>

      {!isConnected ? (
        <div className="card cardGlow">
          <p className="muted">Connect your wallet to view your stats.</p>
        </div>
      ) : (
        <>
          <div className="grid3">
            <div className="card">
              <div className="muted" style={{ fontSize: 12 }}>Total Deposited</div>
              <div style={{ fontSize: 22, fontWeight: 900 }} className="neonCyan">—</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>BTCB (coming soon)</div>
            </div>

            <div className="card">
              <div className="muted" style={{ fontSize: 12 }}>UXL Earned</div>
              <div style={{ fontSize: 22, fontWeight: 900 }} className="neonMagenta">—</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>Claimable (coming soon)</div>
            </div>

            <div className="card">
              <div className="muted" style={{ fontSize: 12 }}>Level</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>—</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>Boosts & priority (coming soon)</div>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className="card cardGlow">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div className="muted" style={{ fontSize: 12 }}>Wallet</div>
                <div style={{ marginTop: 6 }}>
                  <code style={{ color: "rgba(252,253,253,0.9)" }}>{address}</code>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontSize: 12 }}>Status</div>
                <div style={{ marginTop: 6, color: "var(--cyan)", fontWeight: 800 }}>Connected</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
