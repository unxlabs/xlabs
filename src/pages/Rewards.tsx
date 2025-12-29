export default function Rewards() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 className="pageTitle">Rewards</h2>
      <p className="pageSub">Claimable UXL rewards and history (coming soon).</p>

      <div className="card cardGlow">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li className="muted">Claim UXL</li>
          <li className="muted">Rewards history</li>
          <li className="muted">APR / emission settings</li>
        </ul>
      </div>
    </div>
  );
}
