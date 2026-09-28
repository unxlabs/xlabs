import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  CircleUserRound,
  Crown,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
  Users,
  WalletCards,
} from "lucide-react";

import styles from "./AdminDashboard.module.css";
import { useAuth } from "@/shared/auth/AuthProvider";
import {
  AdminApiError,
  getAdminOverview,
  type AdminOverviewResponse,
} from "@/shared/api/admin";

type LoadState = "idle" | "loading" | "ready" | "forbidden" | "error";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const {
    isAuthenticated,
    isAuthenticating,
    isRestoring,
    authenticate,
    wallet,
  } = useAuth();

  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadState("loading");
    setMessage(null);

    try {
      const result = await getAdminOverview();
      setOverview(result);
      setLoadState("ready");
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 403) {
        setLoadState("forbidden");
      } else {
        setLoadState("error");
      }
      setMessage(error instanceof Error ? error.message : "Unable to load admin analytics.");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadOverview();
    } else {
      setOverview(null);
      setLoadState("idle");
    }
  }, [isAuthenticated, loadOverview]);

  const activeRate = useMemo(() => {
    if (!overview || overview.users.total === 0) return 0;
    return Math.round((overview.users.active7d / overview.users.total) * 100);
  }, [overview]);

  const holderRate = useMemo(() => {
    if (!overview || overview.users.total === 0) return 0;
    return Math.round((overview.genesis.holders / overview.users.total) * 100);
  }, [overview]);

  if (isRestoring) {
    return (
      <main className={styles.gate}>
        <LoaderCircle className={styles.spin} size={28} />
        <h1>Restoring admin session</h1>
        <p>Checking your existing Unlimited X Labs session.</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className={styles.gate}>
        <div className={styles.gateIcon}><ShieldCheck size={30} /></div>
        <span className={styles.eyebrow}>Restricted area</span>
        <h1>Unlimited X Labs Admin</h1>
        <p>Connect and sign in with an authorized admin wallet to continue.</p>
        <ConnectButton.Custom>
          {({ account, chain, mounted, openConnectModal }) => {
            const connected = mounted && Boolean(account && chain);
            return (
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!mounted || isAuthenticating}
                onClick={() => {
                  if (!connected) openConnectModal?.();
                  else void authenticate();
                }}
              >
                {isAuthenticating ? "Signing in…" : connected ? "Sign in" : "Connect wallet"}
              </button>
            );
          }}
        </ConnectButton.Custom>
        <Link className={styles.backLink} to="/app"><ArrowLeft size={16} /> Back to app</Link>
      </main>
    );
  }

  if (loadState === "forbidden") {
    return (
      <main className={styles.gate}>
        <div className={styles.gateIcon}><ShieldCheck size={30} /></div>
        <span className={styles.eyebrow}>Access denied</span>
        <h1>Admin permission required</h1>
        <p>{message || "This wallet is authenticated but is not an active administrator."}</p>
        <Link className={styles.primaryLink} to="/app">Return to app</Link>
      </main>
    );
  }

  if (loadState === "loading" && !overview) {
    return (
      <main className={styles.gate}>
        <LoaderCircle className={styles.spin} size={28} />
        <h1>Loading operations</h1>
        <p>Reading the latest platform analytics from D1.</p>
      </main>
    );
  }

  if (!overview) {
    return (
      <main className={styles.gate}>
        <h1>Admin analytics unavailable</h1>
        <p>{message || "The overview could not be loaded."}</p>
        <button className={styles.primaryButton} type="button" onClick={() => void loadOverview()}>
          Try again
        </button>
      </main>
    );
  }

  const cards = [
    { label: "Registered users", value: overview.users.total, detail: `+${overview.users.new7d} in 7 days`, icon: Users },
    { label: "Active users · 7d", value: overview.users.active7d, detail: `${activeRate}% of registered users`, icon: Activity },
    { label: "Connected wallets", value: overview.wallets.total, detail: "Non-blocked wallets", icon: WalletCards },
    { label: "Genesis holders", value: overview.genesis.holders, detail: `${holderRate}% of registered users`, icon: Crown },
    { label: "Genesis passes", value: overview.genesis.passes, detail: "Synced on BNB Chain", icon: TicketCheck },
    { label: "New users · 30d", value: overview.users.new30d, detail: `${overview.users.newToday} today`, icon: CircleUserRound },
  ];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} to="/"><strong>Unlimited</strong><span>X Labs</span></Link>
        <div className={styles.sideLabel}>OPERATIONS</div>
        <div className={styles.sideActive}><Activity size={18} /> Overview</div>
        <div className={styles.sideSoon}>XP & progression <span>Soon</span></div>
        <div className={styles.sideSoon}>Missions <span>Soon</span></div>
        <div className={styles.sideSoon}>Referrals <span>Soon</span></div>
        <div className={styles.sideSoon}>Season & airdrop <span>Soon</span></div>
        <div className={styles.sideFooter}>
          <ShieldCheck size={17} /> {overview.admin.role.replace("_", " ")}
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Admin control center</span>
            <h1>Platform overview</h1>
            <p>Live operational view of users, activity and Genesis ownership.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.walletChip}><BadgeCheck size={16} />{wallet?.address ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : "Admin"}</div>
            <button className={styles.refreshButton} type="button" onClick={() => void loadOverview()} disabled={loadState === "loading"}>
              <RefreshCw className={loadState === "loading" ? styles.spin : undefined} size={16} /> Refresh
            </button>
            <Link className={styles.appLink} to="/app">Open app</Link>
          </div>
        </header>

        <section className={styles.metrics} aria-label="Key platform metrics">
          {cards.map(({ label, value, detail, icon: Icon }) => (
            <article className={styles.metricCard} key={label}>
              <div className={styles.metricTop}><span>{label}</span><Icon size={19} /></div>
              <strong>{formatNumber(value)}</strong>
              <small>{detail}</small>
            </article>
          ))}
        </section>

        <section className={styles.grid}>
          <article className={styles.panel}>
            <div className={styles.panelHeading}><div><span className={styles.eyebrow}>Growth</span><h2>User activity</h2></div></div>
            <div className={styles.rows}>
              <div><span>New today</span><strong>{formatNumber(overview.users.newToday)}</strong></div>
              <div><span>New · 7 days</span><strong>{formatNumber(overview.users.new7d)}</strong></div>
              <div><span>New · 30 days</span><strong>{formatNumber(overview.users.new30d)}</strong></div>
              <div><span>Active · 7 days</span><strong>{formatNumber(overview.users.active7d)}</strong></div>
              <div><span>Active · 30 days</span><strong>{formatNumber(overview.users.active30d)}</strong></div>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeading}><div><span className={styles.eyebrow}>Genesis</span><h2>Tier distribution</h2></div><Crown size={21} /></div>
            {overview.genesis.tierDistribution.length === 0 ? (
              <div className={styles.empty}>No synced Genesis holders yet.</div>
            ) : (
              <div className={styles.tiers}>
                {overview.genesis.tierDistribution.map((tier) => (
                  <div className={styles.tier} key={tier.tier_key}>
                    <div><strong>{tier.tier_name}</strong><span>{formatNumber(tier.holders)} holder{tier.holders === 1 ? "" : "s"}</span></div>
                    <b>{formatNumber(tier.passes)} passes</b>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <footer className={styles.footer}>
          <span>Generated {formatTime(overview.generatedAt)}</span>
          <span>Today: {overview.periods.todayTimezone} · 7d/30d: rolling windows</span>
        </footer>
      </main>
    </div>
  );
}
