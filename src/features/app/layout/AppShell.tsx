import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown, Wallet, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./AppShell.module.css";

import { APP_LINKS, SOCIAL_LINKS } from "@/features/app/config/nav";

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className={styles.uxSideNav} aria-label="App navigation">
      {APP_LINKS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/app"}
          className={({ isActive }) =>
            `${styles.uxSideItem} ${isActive ? styles.isActive : ""}`
          }
          onClick={onNavigate}
        >
          {item.label}
        </NavLink>
      ))}

      {SOCIAL_LINKS.length > 0 && (
        <>
          <div className={styles.uxSideDivider} />

          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.to}
              className={styles.uxSideItem}
              href={item.to}
              target="_blank"
              rel="noreferrer"
              onClick={onNavigate}
            >
              {item.label}
            </a>
          ))}
        </>
      )}
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
        const ready =
          mounted && authenticationStatus !== "loading";

        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === "authenticated");

        return (
          <button
            className={styles.uxHeaderWallet}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              if (!ready) return;

              window.setTimeout(() => {
                if (!connected) {
                  openConnectModal?.();
                  return;
                }

                openAccountModal?.();
              }, 0);
            }}
            aria-label={
              connected
                ? `Wallet ${account?.displayName ?? ""}`
                : "Connect wallet"
            }
            disabled={!ready}
            style={
              !ready
                ? {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  }
                : undefined
            }
          >
            <span
              className={styles.uxHeaderWalletIcon}
              aria-hidden
            >
              <Wallet size={18} />
            </span>

            <span className={styles.uxHeaderWalletText}>
              {connected
                ? account?.displayName ?? "Wallet"
                : "Wallet"}
            </span>

            <span
              className={styles.uxHeaderWalletChevron}
              aria-hidden
            >
              <ChevronDown size={18} />
            </span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);

  const location = useLocation();

  const noticeKey = useMemo(
    () => "ux_bnb_notice_v1_dismissed",
    [],
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    try {
      const dismissed =
        window.localStorage.getItem(noticeKey) === "1";

      setNoticeOpen(!dismissed);
    } catch {
      setNoticeOpen(true);
    }
  }, [noticeKey]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (mobileOpen) {
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
  }, [mobileOpen]);

  return (
    <div
      className={`${styles.uxAppShell} ${styles.uxAppThemeLight}`}
    >
      {/* DESKTOP SIDEBAR */}

      <aside className={styles.uxSide}>
        <Link
          to="/"
          className={styles.uxSideBrand}
          aria-label="Unlimited X Labs home"
        >
          <strong>Unlimited</strong>
          <span>X Labs</span>
        </Link>

        <SideNav />
      </aside>

      {/* APP */}

      <div className={styles.uxAppMain}>
        {/* HEADER */}

        <div className={styles.uxHeaderBitfi}>
          <Link
            to="/"
            className={styles.uxHeaderLogo}
            aria-label="Unlimited X Labs home"
          >
            <strong>Unlimited</strong>
            <span>X Labs</span>
          </Link>

          <div className={styles.uxHeaderRight}>
            <HeaderWalletPill />

            <button
              className={styles.uxHeaderHamburger}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              title="Menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* NETWORK NOTICE */}

        {noticeOpen && (
          <div
            className={styles.uxNotice}
            role="status"
            aria-live="polite"
          >
            <div className={styles.uxNoticeInner}>
              <div className={styles.uxNoticeText}>
                Unlimited X Labs is live on BNB Chain — explore Earn,
                Stake and Genesis Pass.
              </div>

              <button
                className={styles.uxNoticeClose}
                type="button"
                aria-label="Dismiss"
                onClick={() => {
                  setNoticeOpen(false);

                  try {
                    window.localStorage.setItem(
                      noticeKey,
                      "1",
                    );
                  } catch {
                    // Ignore storage errors.
                  }
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* MOBILE NAVIGATION */}

        {mobileOpen && (
          <>
            <div
              className={styles.uxAppNavBackdrop}
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />

            <div
              className={styles.uxAppNavPanel}
              role="dialog"
              aria-modal="true"
              aria-label="App navigation"
            >
              <div className={styles.uxAppNavTop}>
                <div className={styles.uxAppNavTitle}>
                  Menu
                </div>

                <button
                  className={styles.uxAppNavClose}
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.uxAppNavSection}>
                <div
                  className={styles.uxAppNavSectionTitle}
                >
                  App
                </div>

                <div className={styles.uxAppNavList}>
                  {APP_LINKS.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/app"}
                      className={({ isActive }) =>
                        `${styles.uxAppNavItem} ${
                          isActive
                            ? styles.isActive
                            : ""
                        }`
                      }
                      onClick={() =>
                        setMobileOpen(false)
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {SOCIAL_LINKS.length > 0 && (
                <div className={styles.uxAppNavSection}>
                  <div
                    className={styles.uxAppNavSectionTitle}
                  >
                    Links
                  </div>

                  <div className={styles.uxAppNavList}>
                    {SOCIAL_LINKS.map((item) => (
                      <a
                        key={item.to}
                        className={styles.uxAppNavItem}
                        href={item.to}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          setMobileOpen(false)
                        }
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* PAGE */}

        <div className={styles.uxAppContent}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}