import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown, Wallet, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./AppShell.module.css";

import { APP_LINKS, SOCIAL_LINKS } from "@/features/app/config/nav";

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className={styles.uxSideNav}>
      {APP_LINKS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/app"}
          className={({ isActive }) =>
            `${styles.uxSideItem} ${isActive ? styles.isActive : ""}`
          }
          onClick={onNavigate}
        >
          {it.label}
        </NavLink>
      ))}

      <div className={styles.uxSideDivider} />

      {SOCIAL_LINKS.map((it) => (
        <a
          key={it.to}
          className={styles.uxSideItem}
          href={it.to}
          target="_blank"
          rel="noreferrer"
          onClick={onNavigate}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

function HeaderWalletPill() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openConnectModal,
        authenticationStatus,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <button
            className={styles.uxHeaderWallet}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // للتأكد بالكونسول (احذفها بعد ما يزبط)
              console.log("wallet click", {
                ready,
                connected,
                authenticationStatus,
                hasOpenConnectModal: !!openConnectModal,
                hasOpenAccountModal: !!openAccountModal,
              });

              if (!ready) return;

              // ✅ مهم: فتح المودال بعد انتهاء حدث الكليك
              window.setTimeout(() => {
                if (!connected) openConnectModal?.();
                else openAccountModal?.();
              }, 0);
            }}
            aria-label="Wallet"
            disabled={!ready}
            style={!ready ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            <span className={styles.uxHeaderWalletIcon} aria-hidden>
              <Wallet size={18} />
            </span>

            <span className={styles.uxHeaderWalletText}>Wallet</span>

            <span className={styles.uxHeaderWalletChevron} aria-hidden>
              <ChevronDown size={18} />
            </span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function AppShell() {
  const [mobOpen, setMobOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const location = useLocation();
  const noticeKey = useMemo(() => "ux_notice_v1_dismissed", []);

  // سكّر منيو الموبايل عند تغيير الصفحة
  useEffect(() => {
    setMobOpen(false);
  }, [location.pathname]);

  // تذكّر إغلاق الإشعار
  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(noticeKey) === "1";
      setNoticeOpen(!dismissed);
    } catch {
      setNoticeOpen(true);
    }
  }, [noticeKey]);

  // منع سكرول الخلفية لما منيو الموبايل مفتوحة
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (mobOpen) {
      root.classList.add("uxMenuOpen");
      body.classList.add("uxMenuOpen");
    } else {
      root.classList.remove("uxMenuOpen");
      body.classList.remove("uxMenuOpen");
    }

    return () => {
      root.classList.remove("uxMenuOpen");
      body.classList.remove("uxMenuOpen");
    };
  }, [mobOpen]);

  return (
    <div className={`${styles.uxAppShell} ${styles.uxAppThemeLight}`}>
      {/* Sidebar (Desktop) */}
      <aside className={styles.uxSide}>
        <Link to="/" className={styles.uxSideBrand}>
          <strong>Unlimited</strong>
          <span>X Labs</span>
        </Link>

        <SideNav />
      </aside>

      {/* Main */}
      <div className={styles.uxAppMain}>
        {/* Header like BitFi */}
        <div className={styles.uxHeaderBitfi}>
          <Link to="/" className={styles.uxHeaderLogo} aria-label="Home">
            <strong>Unlimited</strong>
            <span>X Labs</span>
          </Link>

          <div className={styles.uxHeaderRight}>
            <HeaderWalletPill />

            <button
              className={styles.uxHeaderHamburger}
              type="button"
              onClick={() => setMobOpen(true)}
              aria-label="Open menu"
              title="Menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Notice banner */}
        {noticeOpen && (
          <div className={styles.uxNotice} role="status" aria-live="polite">
            <div className={styles.uxNoticeInner}>
              <div className={styles.uxNoticeText}>
                On Ethereum — deposit and earn $BFI airdrop
              </div>
              <button
                className={styles.uxNoticeClose}
                type="button"
                aria-label="Dismiss"
                onClick={() => {
                  setNoticeOpen(false);
                  try {
                    window.localStorage.setItem(noticeKey, "1");
                  } catch {}
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Drawer */}
        {mobOpen && (
          <>
            <div
              className={styles.uxAppNavBackdrop}
              onClick={() => setMobOpen(false)}
              aria-hidden
            />
            <div
              className={styles.uxAppNavPanel}
              role="dialog"
              aria-modal="true"
            >
              <div className={styles.uxAppNavTop}>
                <div className={styles.uxAppNavTitle}>Menu</div>
                <button
                  className={styles.uxAppNavClose}
                  type="button"
                  onClick={() => setMobOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.uxAppNavSection}>
                <div className={styles.uxAppNavSectionTitle}>App</div>
                <div className={styles.uxAppNavList}>
                  {APP_LINKS.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.to === "/app"}
                      className={({ isActive }) =>
                        `${styles.uxAppNavItem} ${
                          isActive ? styles.isActive : ""
                        }`
                      }
                      onClick={() => setMobOpen(false)}
                    >
                      {it.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className={styles.uxAppNavSection}>
                <div className={styles.uxAppNavSectionTitle}>Links</div>
                <div className={styles.uxAppNavList}>
                  {SOCIAL_LINKS.map((it) => (
                    <a
                      key={it.to}
                      className={styles.uxAppNavItem}
                      href={it.to}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMobOpen(false)}
                    >
                      {it.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className={styles.uxAppContent}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}