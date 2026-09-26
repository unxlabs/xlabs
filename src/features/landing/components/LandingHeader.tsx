import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./LandingHeader.module.css";

type MenuKey = "products" | null;

function BitcoinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.75c-5.108 0-9.25 4.142-9.25 9.25S6.892 21.25 12 21.25 21.25 17.108 21.25 12 17.108 2.75 12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M10.1 7.4h3.4c1.4 0 2.4.9 2.4 2.1 0 1-.7 1.7-1.4 1.9 1 .2 1.9 1 1.9 2.3 0 1.5-1.2 2.5-3 2.5h-3.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M11.3 6.3v11.4M13.1 6.3v11.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7.5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 12h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M12 9.3c-1.2 0-2.1.6-2.1 1.5 0 1 1.1 1.3 2.1 1.5 1 .2 2.1.5 2.1 1.5 0 .9-.9 1.5-2.1 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DropItem({
  type,
  title,
  desc,
  href,
  onClick,
}: {
  type: "btc" | "usd";
  title: string;
  desc: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link
      className={styles.uxDropItemRow}
      to={href}
      onClick={onClick}
    >
      <div
        className={styles.uxDropIconWrap}
        aria-hidden
      >
        {type === "btc" ? (
          <BitcoinIcon />
        ) : (
          <DollarIcon />
        )}
      </div>

      <div className={styles.uxDropText}>
        <div className={styles.uxDropTitle}>
          {title}
        </div>

        <div className={styles.uxDropDesc}>
          {desc}
        </div>
      </div>
    </Link>
  );
}

function PixelBMark() {
  const dots = [
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],

    [1, 2],
    [2, 2],
    [6, 2],
    [7, 2],

    [1, 3],
    [2, 3],
    [6, 3],
    [7, 3],

    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],
    [6, 4],

    [1, 5],
    [2, 5],
    [6, 5],
    [7, 5],

    [1, 6],
    [2, 6],
    [6, 6],
    [7, 6],

    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ];

  return (
    <div
      className={styles.uxBMark}
      aria-hidden
    >
      <div className={styles.uxBGrid}>
        {dots.map(([x, y], index) => (
          <span
            key={`${x}-${y}-${index}`}
            className={styles.uxBDot}
            style={
              {
                left: `calc(${x} * (var(--cell) + var(--gap)))`,
                top: `calc(${y} * (var(--cell) + var(--gap)))`,
                "--i": index,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingHeader() {
  const [open, setOpen] =
    useState<MenuKey>(null);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [mobileProductsOpen, setMobileProductsOpen] =
    useState(false);

  const closeDesktop = () => {
    setOpen(null);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileProductsOpen(false);
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 960) {
        closeMobile();
      }
    };

    window.addEventListener(
      "resize",
      onResize,
    );

    return () =>
      window.removeEventListener(
        "resize",
        onResize,
      );
  }, []);

  return (
    <header className={styles.uxHeader}>
      <div
        className={`${styles.uxHeaderInner} ${styles.uxHeaderInnerLanding}`}
      >
        {/* BRAND */}

        <Link
          to="/"
          className={styles.uxBrand}
          aria-label="Unlimited X Labs home"
          onClick={closeMobile}
        >
          <span
            className={styles.uxBrandTextStack}
          >
            <span
              className={styles.uxBrandTop}
            >
              Unlimited
            </span>

            <span
              className={styles.uxBrandBottom}
            >
              X Labs
            </span>
          </span>
        </Link>

        {/* MOBILE MENU BUTTON */}

        <button
          className={styles.uxMobileMenuBtn}
          type="button"
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={mobileOpen}
          onClick={() =>
            setMobileOpen((value) => !value)
          }
        >
          <span
            className={styles.uxHamburger}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* DESKTOP NAVIGATION */}

        <div
          className={`${styles.uxHeaderRight} ${styles.uxHeaderRightLanding}`}
        >
          <nav
            className={styles.uxNav}
            aria-label="Primary navigation"
          >
            {/* PRODUCTS */}

            <div
              className={styles.uxNavItem}
              onMouseEnter={() =>
                setOpen("products")
              }
              onMouseLeave={closeDesktop}
            >
              <button
                className={`${styles.uxNavBtn} ${
                  open === "products"
                    ? styles.isOpen
                    : ""
                }`}
                type="button"
                aria-haspopup="true"
                aria-expanded={
                  open === "products"
                }
                onClick={() =>
                  setOpen((current) =>
                    current === "products"
                      ? null
                      : "products",
                  )
                }
              >
                Products
              </button>

              {open === "products" && (
                <div
                  className={`${styles.uxDropdown} ${styles.uxDropdownWide} ${styles.uxDropdownTight}`}
                  role="menu"
                >
                  <div
                    className={
                      styles.uxDropColLeft
                    }
                  >
                    <DropItem
                      type="btc"
                      title="bfBTC"
                      desc="Bitcoin yield product"
                      href="/app/earn?asset=btc"
                      onClick={closeDesktop}
                    />

                    <DropItem
                      type="usd"
                      title="bfUSD"
                      desc="USD yield product"
                      href="/app/earn?asset=usd"
                      onClick={closeDesktop}
                    />
                  </div>

                  <div
                    className={`${styles.uxDropColRight} ${styles.uxDropColRightNoBg}`}
                    aria-hidden
                  >
                    <PixelBMark />
                  </div>
                </div>
              )}
            </div>

            {/* DIRECT DESTINATIONS */}

            <Link
              className={styles.uxNavBtn}
              to="/app/stake"
            >
              Stake
            </Link>

            <Link
              className={styles.uxNavBtn}
              to="/app/genesis"
            >
              Genesis Pass
            </Link>

            <Link
              className={styles.uxNavBtn}
              to="/app/ecosystem"
            >
              Ecosystem
            </Link>
          </nav>

          <Link
            className={styles.uxEntryBtn}
            to="/app"
          >
            Launch App
          </Link>
        </div>
      </div>

      {/* MOBILE */}

      {mobileOpen && (
        <div
          className={styles.uxMobileOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className={styles.uxMobilePanel}
          >
            <div
              className={styles.uxMobileTop}
            >
              <Link
                to="/"
                className={
                  styles.uxMobileBrand
                }
                onClick={closeMobile}
              >
                <span
                  className={
                    styles.uxBrandTextStack
                  }
                >
                  <span
                    className={
                      styles.uxBrandTop
                    }
                  >
                    Unlimited
                  </span>

                  <span
                    className={
                      styles.uxBrandBottom
                    }
                  >
                    X Labs
                  </span>
                </span>
              </Link>

              <button
                className={
                  styles.uxMobileClose
                }
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div
              className={styles.uxMobileBWrap}
              aria-hidden
            >
              <PixelBMark />
            </div>

            <div
              className={styles.uxMobileList}
            >
              {/* PRODUCTS */}

              <button
                className={
                  styles.uxMobileItem
                }
                type="button"
                onClick={() =>
                  setMobileProductsOpen(
                    (value) => !value,
                  )
                }
                aria-expanded={
                  mobileProductsOpen
                }
              >
                Earn Products

                <span
                  className={
                    styles.uxMobileChevron
                  }
                >
                  {mobileProductsOpen
                    ? "–"
                    : "+"}
                </span>
              </button>

              {mobileProductsOpen && (
                <div
                  className={
                    styles.uxMobileSub
                  }
                >
                  <Link
                    className={
                      styles.uxMobileLink
                    }
                    to="/app/earn?asset=btc"
                    onClick={closeMobile}
                  >
                    bfBTC

                    <span
                      className={
                        styles.uxMobileSubDesc
                      }
                    >
                      Bitcoin yield product
                    </span>
                  </Link>

                  <Link
                    className={
                      styles.uxMobileLink
                    }
                    to="/app/earn?asset=usd"
                    onClick={closeMobile}
                  >
                    bfUSD

                    <span
                      className={
                        styles.uxMobileSubDesc
                      }
                    >
                      USD yield product
                    </span>
                  </Link>
                </div>
              )}

              {/* STAKE */}

              <Link
                className={
                  styles.uxMobileItem
                }
                to="/app/stake"
                onClick={closeMobile}
              >
                Stake
              </Link>

              {/* GENESIS */}

              <Link
                className={
                  styles.uxMobileItem
                }
                to="/app/genesis"
                onClick={closeMobile}
              >
                Genesis Pass
              </Link>

              {/* ECOSYSTEM */}

              <Link
                className={
                  styles.uxMobileItem
                }
                to="/app/ecosystem"
                onClick={closeMobile}
              >
                Ecosystem
              </Link>

              {/* LEARN */}

              <Link
                className={
                  styles.uxMobileItem
                }
                to="/app/learn"
                onClick={closeMobile}
              >
                Learn
              </Link>

              {/* APP */}

              <Link
                className={
                  styles.uxMobileEntry
                }
                to="/app"
                onClick={closeMobile}
              >
                Launch App
              </Link>
            </div>
          </div>

          <button
            className={
              styles.uxMobileOverlayClick
            }
            type="button"
            onClick={closeMobile}
            aria-label="Close menu"
          />
        </div>
      )}
    </header>
  );
}