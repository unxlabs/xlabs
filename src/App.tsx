import { Link, Route, Routes, NavLink, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";
import { BookOpen, ChevronDown, ExternalLink, Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import logo from "./assets/logo.png";
import AnimatedBlockchainBg from "./components/AnimatedBlockchainBg";
import BackgroundDecor from "./components/BackgroundDecor";

import Overview from "./pages/Overview";
import Deposit from "./pages/Deposit";
import Rewards from "./pages/Rewards";
import Dashboard from "./pages/Dashboard";

function Pill({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        color: isActive ? "var(--cyan)" : "rgba(252,253,253,0.86)",
        padding: "8px 12px",
        borderRadius: 14,
        border: `1px solid ${isActive ? "rgba(8,230,254,0.25)" : "transparent"}`,
        background: isActive ? "rgba(2,15,40,0.35)" : "transparent",
        whiteSpace: "nowrap",
      })}
    >
      {label}
    </NavLink>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <BackgroundDecor />
      <AnimatedBlockchainBg />

      <header className="header">
        <div className="headerInner">
          {/* Brand */}
          <Link to="/" className="brand" style={{ textDecoration: "none" }}>
            <img
              src={logo}
              alt="Unlimited X Labs"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                objectFit: "cover",
                boxShadow: "0 0 28px rgba(8,230,254,0.18)",
              }}
            />
            <div className="brandText">
              <strong className="neonCyan">UNLIMITED</strong>
              <span>X LABS</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="navPills">
            <Pill to="/" label="Overview" end />
            <Pill to="/deposit" label="Deposit" />
            <Pill to="/rewards" label="Rewards" />
            <Pill to="/dashboard" label="Dashboard" />
          </nav>

          {/* Right actions */}
          <div className="topActions">
            {/* Mobile Menu */}
            <button className="linkBtn mobileMenuBtn" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              Menu
            </button>

            <div className="badge" title="Network">
              <span className="badgeDot" />
              Mainnet
            </div>

            <button className="linkBtn docsBtn" onClick={() => toast("Docs coming soon", { icon: "📘" })} title="Docs">
              <BookOpen size={16} />
              Docs
            </button>

            <div className="socials">
              <details>
                <summary className="linkBtn">
                  Socials <ChevronDown size={16} />
                </summary>
                <div className="socialMenu">
                  <a className="socialItem" href="https://x.com/" target="_blank" rel="noreferrer">
                    X (Twitter) <ExternalLink size={14} />
                  </a>
                  <a className="socialItem" href="https://t.me/" target="_blank" rel="noreferrer">
                    Telegram <ExternalLink size={14} />
                  </a>
                  <a className="socialItem" href="https://discord.com/" target="_blank" rel="noreferrer">
                    Discord <ExternalLink size={14} />
                  </a>
                </div>
              </details>
            </div>

            <ConnectButton />
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="mobileDrawer">
            <div className="mobileLinks">
              <Link className="mobileLink" to="/">
                Overview <ArrowRight size={16} />
              </Link>
              <Link className="mobileLink" to="/deposit">
                Deposit <ArrowRight size={16} />
              </Link>
              <Link className="mobileLink" to="/rewards">
                Rewards <ArrowRight size={16} />
              </Link>
              <Link className="mobileLink" to="/dashboard">
                Dashboard <ArrowRight size={16} />
              </Link>

              <button
                className="mobileLink"
                type="button"
                onClick={() => toast("Docs coming soon", { icon: "📘" })}
                style={{ cursor: "pointer", width: "100%" }}
              >
                Docs <ArrowRight size={16} />
              </button>

              <a className="mobileLink" href="https://x.com/" target="_blank" rel="noreferrer">
                X (Twitter) <ExternalLink size={16} />
              </a>
              <a className="mobileLink" href="https://t.me/" target="_blank" rel="noreferrer">
                Telegram <ExternalLink size={16} />
              </a>
              <a className="mobileLink" href="https://discord.com/" target="_blank" rel="noreferrer">
                Discord <ExternalLink size={16} />
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="main" style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      <footer className="main" style={{ paddingTop: 0, opacity: 0.75, position: "relative", zIndex: 1 }}>
        <div className="hr" />
        Unlimited X Labs — BTCB Deposit → Proof of Participation → UXL Rewards + Utility
      </footer>
    </div>
  );
}
