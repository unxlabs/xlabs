import { Link, Route, Routes, NavLink, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";
import { BookOpen, ChevronDown, ExternalLink, Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AnimatedBlockchainBg from "./components/AnimatedBlockchainBg";
import SplashIntro from "./components/SplashIntro";

import Overview from "./pages/Overview";
import Deposit from "./pages/Deposit";
import Rewards from "./pages/Rewards";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // ✅ Splash: مرة لكل Session (تقدر تغيّرها لاحقاً)
const [boot, setBoot] = useState(true);


  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close drawer on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navLinkStyle = useMemo(
    () =>
      ({ isActive }: { isActive: boolean }) => ({
        color: isActive ? "var(--cyan)" : "rgba(252,253,253,0.86)",
        border: `1px solid ${isActive ? "rgba(8,230,254,0.25)" : "transparent"}`,
        background: isActive ? "rgba(2,15,40,0.35)" : "transparent",
        textDecoration: "none",
      }),
    []
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* ✅ Background (canvas) */}
      <AnimatedBlockchainBg />

      {/* ✅ Splash Intro */}
      {boot && (
        <SplashIntro
          title="UNLIMITED"
          subtitle="X LABS"
          durationMs={3000}
     onDone={() => setBoot(false)}

        />
      )}

      <header className="header" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div className="headerInner">
          {/* ✅ Brand (بدون لوقو) */}
          <Link to="/" className="brand" style={{ textDecoration: "none" }} aria-label="Unlimited X Labs">
            <div className="brandText" style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <strong className="neonCyan" style={{ letterSpacing: "0.18em" }}>
                UNLIMITED
              </strong>
              <span style={{ letterSpacing: "0.28em", opacity: 0.85 }}>X LABS</span>
            </div>
          </Link>

          {/* ✅ Desktop nav */}
          <nav className="navPills" aria-label="Primary">
            <NavLink to="/" end style={navLinkStyle}>
              Overview
            </NavLink>
            <NavLink to="/deposit" style={navLinkStyle}>
              Deposit
            </NavLink>
            <NavLink to="/rewards" style={navLinkStyle}>
              Rewards
            </NavLink>
            <NavLink to="/dashboard" style={navLinkStyle}>
              Dashboard
            </NavLink>
          </nav>

          {/* ✅ Right actions */}
          <div className="topActions">
            {/* Mobile menu button */}
            <button
              className="linkBtn mobileMenuBtn"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Open menu"
              title="Menu"
              type="button"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              Menu
            </button>

            <div className="badge" title="Network">
              <span className="badgeDot" />
              Mainnet
            </div>

            <button
              className="linkBtn docsBtn"
              type="button"
              onClick={() => toast("Docs coming soon", { icon: "📘" })}
              title="Docs"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={16} />
                Docs
              </span>
            </button>

            <div className="socials">
              <details>
                <summary className="linkBtn" title="Socials">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Socials <ChevronDown size={16} />
                  </span>
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

        {/* ✅ Mobile drawer */}
        {mobileOpen && (
          <>
            {/* backdrop */}
            <div
              className="mobileBackdrop"
              onClick={() => setMobileOpen(false)}
              aria-hidden
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
              }}
            />

            <div
              className="mobileDrawer"
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                top: "calc(var(--headerH, 72px))",
                zIndex: 45,
              }}
            >
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

                <a className="mobileLink" href="https://discord.com/" target="_blank" rel="noreferrer">
                  Discord <ExternalLink size={16} />
                </a>

                <a className="mobileLink" href="https://x.com/" target="_blank" rel="noreferrer">
                  X (Twitter) <ExternalLink size={16} />
                </a>

                <a className="mobileLink" href="https://t.me/" target="_blank" rel="noreferrer">
                  Telegram <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </>
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
