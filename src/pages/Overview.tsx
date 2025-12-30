import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function Overview() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <motion.div
        className="card cardGlow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 style={{ margin: 0, fontSize: 34 }}>
          BTCB Deposit -- → <span className="neonCyan">Proof of Participation</span>
        </h1>
        <p className="pageSub" style={{ marginTop: 10 }}>
          Earn UXL rewards and unlock utility: levels, boosts, priority drops, and launch access.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <Link to="/deposit" className="btn btnPrimary" style={{ display: "inline-block" }}>
            Go to Deposit
          </Link>
          <Link to="/dashboard" className="btn" style={{ display: "inline-block" }}>
            Open Dashboard
          </Link>
        </div>
      </motion.div>

      <div style={{ marginTop: 14 }} className="grid3">
        <div className="card">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Zap size={18} />
            <strong>Fast UX</strong>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Simple deposit flow and clear rewards tracking.
          </p>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ShieldCheck size={18} />
            <strong>Participation Proof</strong>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Your wallet activity becomes your platform identity.
          </p>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Sparkles size={18} />
            <strong>Utility Layer</strong>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Unlock boosts, priority drops, and launch access.
          </p>
        </div>
      </div>
    </div>
  );
}
