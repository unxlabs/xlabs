import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import styles from "./LandingHeader.module.css";

type MenuKey = "products" | "resources" | "developers" | null;
type MobileKey = "products" | "resources" | "developers" | null;

function Icon({
  name,
}: {
  name:
    | "btc"
    | "usd"
    | "brand"
    | "faq"
    | "support"
    | "docs"
    | "security";
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "btc":
      return (
        <svg {...common}>
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

    case "usd":
      return (
        <svg {...common}>
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

    case "brand":
      return (
        <svg {...common}>
          <path
            d="M4.5 6.5h15v12h-15v-12Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 10.5h8M8 13.5h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7.5 6.5V5.7c0-.8.6-1.5 1.5-1.5h6c.9 0 1.5.7 1.5 1.5v.8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );

    case "faq":
      return (
        <svg {...common}>
          <path
            d="M12 21.25c5.108 0 9.25-4.142 9.25-9.25S17.108 2.75 12 2.75 2.75 6.892 2.75 12 6.892 21.25 12 21.25Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9.6 9.6c.2-1.3 1.3-2.2 2.7-2.2 1.6 0 2.7 1 2.7 2.3 0 1.6-1.6 2-2.4 2.6-.6.4-.7.7-.7 1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 16.9h.01"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      );

    case "support":
      return (
        <svg {...common}>
          <path
            d="M12 2.75c-4.9 0-8.9 4-8.9 8.9v2.2c0 1.7 1.4 3.1 3.1 3.1h.9v-6.2h-1v-1.1c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2v1.1h-1v6.2h.9c1.7 0 3.1-1.4 3.1-3.1v-2.2c0-4.9-4-8.9-8.9-8.9Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9.5 19.2c.8 1 1.7 1.6 2.5 1.6s1.7-.6 2.5-1.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "docs":
      return (
        <svg {...common}>
          <path
            d="M7 3.75h8.5c1 0 1.8.8 1.8 1.8v14.7c0 .6-.5 1-1 1H7c-1 0-1.8-.8-1.8-1.8V5.55c0-1 .8-1.8 1.8-1.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8.2 8.2h6.6M8.2 11.2h6.6M8.2 14.2h4.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "security":
      return (
        <svg {...common}>
          <path
            d="M12 3.4 19 6.6v6.2c0 4.4-3 7.7-7 8.8-4-1.1-7-4.4-7-8.8V6.6L12 3.4Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9.2 12.1l1.8 1.9 3.8-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

function DropItem({
  icon,
  title,
  desc,
  href,
}: {
  icon:
    | "btc"
    | "usd"
    | "brand"
    | "faq"
    | "support"
    | "docs"
    | "security";
  title: string;
  desc: string;
  href: string;
}) {
  const isInternal = href.startsWith("/");

  const content = (
    <>
      <div className={styles.uxDropIconWrap} aria-hidden>
        <Icon name={icon} />
      </div>
      <div className={styles.uxDropText}>
        <div className={styles.uxDropTitle}>{title}</div>
        <div className={styles.uxDropDesc}>{desc}</div>
      </div>
    </>
  );

  return isInternal ? (
    <Link className={styles.uxDropItemRow} to={href}>
      {content}
    </Link>
  ) : (
    <a className={styles.uxDropItemRow} href={href}>
      {content}
    </a>
  );
}

function PixelBMark() {
  const dots = useMemo(() => {
    const on = new Set<string>();

    // عمودين يسار
    for (let y = 1; y <= 7; y++) {
      on.add(`1,${y}`);
      on.add(`2,${y}`);
    }

    // خطوط B
    for (let x = 2; x <= 6; x++) {
      on.add(`${x},1`);
      on.add(`${x},4`);
      on.add(`${x},7`);
    }

    // يمين البطنين
    for (let y = 2; y <= 3; y++) on.add(`7,${y}`);
    for (let y = 5; y <= 6; y++) on.add(`7,${y}`);

    // تقويس
    on.add(`6,2`);
    on.add(`6,3`);
    on.add(`6,5`);
    on.add(`6,6`);

    // ترتيب الوميض
    const pts = Array.from(on).map((k) => {
      const [x, y] = k.split(",").map(Number);
      return { x, y };
    });
    pts.sort((a, b) => a.y - b.y || a.x - b.x);
    return pts;
  }, []);

  return (
    <div className={styles.uxBMark} aria-hidden>
      <div className={styles.uxBGrid}>
        {dots.map((p, i) => (
          <span
            key={`${p.x}-${p.y}`}
            className={styles.uxBDot}
            style={
              {
                left: `calc(${p.x} * (var(--cell) + var(--gap)))`,
                top: `calc(${p.y} * (var(--cell) + var(--gap)))`,
                "--i": i,
              } as any
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingHeader() {
  const [open, setOpen] = useState<MenuKey>(null);

  // mobile
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MobileKey>(null);

  const toggle = (k: Exclude<MenuKey, null>) =>
    setOpen((prev) => (prev === k ? null : k));
  const close = () => setOpen(null);

  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => {
    setMobileOpen(false);
    setMobileSection(null);
  };

  const toggleMobileSection = (k: Exclude<MobileKey, null>) =>
    setMobileSection((prev) => (prev === k ? null : k));

  // اقفل منيو الموبايل عند resize للديسكتوب
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 960) closeMobile();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className={styles.uxHeader}>
      <div className={`${styles.uxHeaderInner} ${styles.uxHeaderInnerLanding}`}>
        <Link
          to="/"
          className={styles.uxBrand}
          aria-label="Home"
          onClick={closeMobile}
        >
          <span className={styles.uxBrandTextStack}>
            <span className={styles.uxBrandTop}>Unlimited</span>
            <span className={styles.uxBrandBottom}>X Labs</span>
          </span>
        </Link>

        {/* زر الموبايل (hamburger) */}
        <button
          className={styles.uxMobileMenuBtn}
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={toggleMobile}
        >
          <span className={styles.uxHamburger} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* Desktop nav (كما هو) */}
        <div className={`${styles.uxHeaderRight} ${styles.uxHeaderRightLanding}`}>
          <nav className={styles.uxNav} aria-label="Primary">
            {/* Products */}
            <div
              className={styles.uxNavItem}
              onMouseEnter={() => setOpen("products")}
              onMouseLeave={close}
            >
              <button
                className={`${styles.uxNavBtn} ${
                  open === "products" ? styles.isOpen : ""
                }`}
                type="button"
                aria-haspopup="true"
                aria-expanded={open === "products"}
                onClick={() => toggle("products")}
              >
                Products
              </button>

              {open === "products" ? (
                <div
                  className={`${styles.uxDropdown} ${styles.uxDropdownWide} ${styles.uxDropdownTight}`}
                  role="menu"
                >
                  <div className={styles.uxDropColLeft}>
                    <DropItem
                      icon="btc"
                      title="bfBTC"
                      desc="Yield-bearing Bitcoin LST"
                      href="/app/stake"
                    />
                    <DropItem
                      icon="usd"
                      title="bfUSD"
                      desc="Delta-neutral stable-coin"
                      href="/app/stake"
                    />
                  </div>
                  <div
                    className={`${styles.uxDropColRight} ${styles.uxDropColRightNoBg}`}
                    aria-hidden
                  >
                    <PixelBMark />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Resources */}
            <div
              className={styles.uxNavItem}
              onMouseEnter={() => setOpen("resources")}
              onMouseLeave={close}
            >
              <button
                className={`${styles.uxNavBtn} ${
                  open === "resources" ? styles.isOpen : ""
                }`}
                type="button"
                aria-haspopup="true"
                aria-expanded={open === "resources"}
                onClick={() => toggle("resources")}
              >
                Resources
              </button>

              {open === "resources" ? (
                <div
                  className={`${styles.uxDropdown} ${styles.uxDropdownWide} ${styles.uxDropdownTight}`}
                  role="menu"
                >
                  <div className={styles.uxDropColLeft}>
                    <DropItem
                      icon="brand"
                      title="Brand Assets"
                      desc="Press & brand materials"
                      href="/app/learn"
                    />
                    <DropItem
                      icon="faq"
                      title="FAQ"
                      desc="Frequently asked questions"
                      href="/app/learn"
                    />
                    <DropItem
                      icon="support"
                      title="Help & Support"
                      desc="How to use XLabs"
                      href="/app/learn"
                    />
                  </div>
                  <div
                    className={`${styles.uxDropColRight} ${styles.uxDropColRightNoBg}`}
                    aria-hidden
                  >
                    <PixelBMark />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Developers */}
            <div
              className={styles.uxNavItem}
              onMouseEnter={() => setOpen("developers")}
              onMouseLeave={close}
            >
              <button
                className={`${styles.uxNavBtn} ${
                  open === "developers" ? styles.isOpen : ""
                }`}
                type="button"
                aria-haspopup="true"
                aria-expanded={open === "developers"}
                onClick={() => toggle("developers")}
              >
                Developers
              </button>

              {open === "developers" ? (
                <div
                  className={`${styles.uxDropdown} ${styles.uxDropdownWide} ${styles.uxDropdownTight}`}
                  role="menu"
                >
                  <div className={styles.uxDropColLeft}>
                    <DropItem
                      icon="docs"
                      title="Documentation"
                      desc="Technical guides for dev"
                      href="/app/learn"
                    />
                    <DropItem
                      icon="security"
                      title="Security"
                      desc="Audit reports and information"
                      href="/app/learn"
                    />
                  </div>
                  <div
                    className={`${styles.uxDropColRight} ${styles.uxDropColRightNoBg}`}
                    aria-hidden
                  >
                    <PixelBMark />
                  </div>
                </div>
              ) : null}
            </div>
          </nav>

          <Link className={styles.uxEntryBtn} to="/app">
            Entry APP
          </Link>
        </div>
      </div>

      {/* Mobile overlay + panel */}
      {mobileOpen ? (
        <div className={styles.uxMobileOverlay} role="dialog" aria-modal="true">
          <div className={styles.uxMobilePanel}>
            <div className={styles.uxMobileTop}>
              <div className={styles.uxMobileBrand}>
                <span className={styles.uxBrandTextStack}>
                  <span className={styles.uxBrandTop}>Unlimited</span>
                  <span className={styles.uxBrandBottom}>X Labs</span>
                </span>
              </div>

              <button
                className={styles.uxMobileClose}
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* B داخل الموبايل منيو */}
            <div className={styles.uxMobileBWrap} aria-hidden>
              <PixelBMark />
            </div>

            <div className={styles.uxMobileList}>
              {/* Products */}
              <button
                className={styles.uxMobileItem}
                type="button"
                onClick={() => toggleMobileSection("products")}
                aria-expanded={mobileSection === "products"}
              >
                Products{" "}
                <span className={styles.uxMobileChevron}>
                  {mobileSection === "products" ? "–" : "+"}
                </span>
              </button>

              {mobileSection === "products" ? (
                <div className={styles.uxMobileSub}>
                  <Link
                    className={styles.uxMobileLink}
                    to="/app/stake"
                    onClick={closeMobile}
                  >
                    bfBTC{" "}
                    <span className={styles.uxMobileSubDesc}>
                      Yield-bearing Bitcoin LST
                    </span>
                  </Link>
                  <Link
                    className={styles.uxMobileLink}
                    to="/app/stake"
                    onClick={closeMobile}
                  >
                    bfUSD{" "}
                    <span className={styles.uxMobileSubDesc}>
                      Delta-neutral stable-coin
                    </span>
                  </Link>
                </div>
              ) : null}

              {/* Resources */}
              <button
                className={styles.uxMobileItem}
                type="button"
                onClick={() => toggleMobileSection("resources")}
                aria-expanded={mobileSection === "resources"}
              >
                Resources{" "}
                <span className={styles.uxMobileChevron}>
                  {mobileSection === "resources" ? "–" : "+"}
                </span>
              </button>

              {mobileSection === "resources" ? (
                <div className={styles.uxMobileSub}>
                  <Link
                    className={styles.uxMobileLink}
                    to="/app/learn"
                    onClick={closeMobile}
                  >
                    Brand Assets{" "}
                    <span className={styles.uxMobileSubDesc}>
                      Press & brand materials
                    </span>
                  </Link>
                  <Link
                    className={styles.uxMobileLink}
                    to="/app/learn"
                    onClick={closeMobile}
                  >
                    FAQ{" "}
                    <span className={styles.uxMobileSubDesc}>
                      Frequently asked questions
                    </span>
                  </Link>
                  <Link
                    className={styles.uxMobileLink}
                    to="/app/learn"
                    onClick={closeMobile}
                  >
                    Help & Support{" "}
                    <span className={styles.uxMobileSubDesc}>
                      How to use XLabs
                    </span>
                  </Link>
                </div>
              ) : null}

              {/* Developers */}
              <button
                className={styles.uxMobileItem}
                type="button"
                onClick={() => toggleMobileSection("developers")}
                aria-expanded={mobileSection === "developers"}
              >
                Developers{" "}
                <span className={styles.uxMobileChevron}>
                  {mobileSection === "developers" ? "–" : "+"}
                </span>
              </button>

              {mobileSection === "developers" ? (
                <div className={styles.uxMobileSub}>
                  <Link
                    className={styles.uxMobileLink}
                    to="/app/learn"
                    onClick={closeMobile}
                  >
                    Documentation{" "}
                    <span className={styles.uxMobileSubDesc}>
                      Technical guides for dev
                    </span>
                  </Link>
                  <Link
                    className={styles.uxMobileLink}
                    to="/app/learn"
                    onClick={closeMobile}
                  >
                    Security{" "}
                    <span className={styles.uxMobileSubDesc}>
                      Audit reports and information
                    </span>
                  </Link>
                </div>
              ) : null}

              {/* Entry APP */}
              <Link
                className={styles.uxMobileEntry}
                to="/app"
                onClick={closeMobile}
              >
                Entry APP
              </Link>
            </div>
          </div>

          {/* ضغط خارج اللوحة يغلق */}
          <button
            className={styles.uxMobileOverlayClick}
            onClick={closeMobile}
            aria-label="Close overlay"
          />
        </div>
      ) : null}
    </header>
  );
}