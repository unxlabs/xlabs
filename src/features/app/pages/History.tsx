import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownToLine, Clock3, Coins, History as HistoryIcon, Layers3, RefreshCw } from "lucide-react";
import { formatUnits } from "viem";

import { getMyOnchainActivity, type OnchainActivity } from "@/shared/api/activity";
import { getMyPositions, type IndexedPosition } from "@/shared/api/positions";
import { useAuth } from "@/shared/auth/AuthProvider";
import styles from "./History.module.css";

type ParsedEvidence = {
  product?: string;
  positionId?: string;
  principal?: string;
  status?: number;
};

const PRODUCT_META: Record<string, { label: string; symbol: string; decimals: number; href: string }> = {
  earn_bfbtc: { label: "bfBTC Earn", symbol: "BTCB", decimals: 18, href: "/app/earn?asset=btc" },
  earn_bfusd: { label: "bfUSD Earn", symbol: "USDT", decimals: 18, href: "/app/earn?asset=usd" },
  stake_bnb: { label: "BNB Stake", symbol: "BNB", decimals: 18, href: "/app/stake" },
  stake_btcb: { label: "BTCB Stake", symbol: "BTCB", decimals: 18, href: "/app/stake" },
  stake_usdt: { label: "USDT Stake", symbol: "USDT", decimals: 18, href: "/app/stake" },
};

const EVENT_LABELS: Record<string, string> = {
  earn_deposit: "Earn position opened",
  earn_withdrawal_requested: "Earn withdrawal requested",
  earn_withdrawn: "Earn position withdrawn",
  stake_deposit: "Stake position opened",
  stake_unlock_requested: "Stake unlock requested",
  stake_withdrawn: "Stake position withdrawn",
};

function parseEvidence(raw: string | null): ParsedEvidence {
  if (!raw) return {};
  try { return JSON.parse(raw) as ParsedEvidence; } catch { return {}; }
}

function formatDate(value: number | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatAtomic(value: string | undefined, decimals: number) {
  if (!value) return "0";
  try {
    const amount = Number(formatUnits(BigInt(value), decimals));
    if (!Number.isFinite(amount)) return "0";
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(amount);
  } catch { return "0"; }
}

function positionStatus(position: IndexedPosition) {
  if (position.productType === "earn") {
    return ({ 0: "None", 1: "Active", 2: "Withdrawal requested", 3: "Ready to claim", 4: "Completed" } as Record<number, string>)[position.status] || `Status ${position.status}`;
  }
  return ({ 0: "None", 1: "Active", 2: "Unlock requested", 3: "Claimable", 4: "Withdrawn" } as Record<number, string>)[position.status] || `Status ${position.status}`;
}

function HistoryContent() {
  const { isAuthenticated, authenticate, isAuthenticating, isRestoring } = useAuth();
  const [positions, setPositions] = useState<IndexedPosition[]>([]);
  const [activities, setActivities] = useState<OnchainActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    const [positionsResult, activityResult] = await Promise.allSettled([getMyPositions(), getMyOnchainActivity()]);
    if (positionsResult.status === "fulfilled") setPositions(positionsResult.value.positions);
    if (activityResult.status === "fulfilled") setActivities(activityResult.value.activities);
    if (positionsResult.status === "rejected" && activityResult.status === "rejected") setError("Unable to load your on-chain history right now.");
    setLoading(false);
  };

  useEffect(() => { void load(); }, [isAuthenticated]);

  const financialActivity = useMemo(
    () => activities.filter((item) => EVENT_LABELS[item.event_type]),
    [activities],
  );

  if (!isAuthenticated) {
    return (
      <div className={styles.signInCard}>
        <HistoryIcon size={22} />
        <div><strong>Your on-chain history is private to your signed-in wallet.</strong><p>Sign in to load verified Earn and Stake activity.</p></div>
        <button type="button" onClick={() => void authenticate()} disabled={isAuthenticating || isRestoring}>{isAuthenticating ? "Check your wallet…" : isRestoring ? "Restoring…" : "Sign in"}</button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.summaryRow}>
        <div><span>POSITIONS</span><strong>{positions.length}</strong></div>
        <div><span>EARN</span><strong>{positions.filter((p) => p.productType === "earn").length}</strong></div>
        <div><span>STAKE</span><strong>{positions.filter((p) => p.productType === "stake").length}</strong></div>
        <button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? styles.spinning : undefined} /> {loading ? "Refreshing" : "Refresh"}</button>
      </div>

      {error ? <div className={styles.errorCard}>{error}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><span>INDEXED POSITIONS</span><h3>Your current on-chain positions</h3></div><p>Read from the Unlimited X indexer. Transaction actions still verify directly against the contracts.</p></div>
        {loading && positions.length === 0 ? <div className={styles.empty}>Loading positions…</div> : positions.length === 0 ? <div className={styles.empty}>No indexed Earn or Stake positions yet.</div> : (
          <div className={styles.positionGrid}>
            {positions.map((position) => {
              const meta = PRODUCT_META[position.contractKey] || { label: position.contractKey, symbol: "TOKEN", decimals: 18, href: position.productType === "earn" ? "/app/earn" : "/app/stake" };
              return <Link to={meta.href} className={styles.positionCard} key={position.id}>
                <div className={styles.cardTop}><span className={styles.productIcon}>{position.productType === "earn" ? <Coins size={18} /> : <Layers3 size={18} />}</span><div><strong>{meta.label}</strong><small>Position #{position.positionId}</small></div><span className={styles.status}>{positionStatus(position)}</span></div>
                <div className={styles.amount}>{formatAtomic(position.principalAtomic, meta.decimals)} <span>{meta.symbol}</span></div>
                <div className={styles.meta}><span>Opened <b>{formatDate(position.createdAtChain)}</b></span><span>Last indexed <b>{formatDate(position.lastSyncedAt)}</b></span></div>
              </Link>;
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><span>VERIFIED ACTIVITY</span><h3>Earn & Stake lifecycle</h3></div><p>Only trusted on-chain financial lifecycle events are shown here.</p></div>
        {loading && financialActivity.length === 0 ? <div className={styles.empty}>Loading activity…</div> : financialActivity.length === 0 ? <div className={styles.empty}>No verified lifecycle activity has been recorded yet.</div> : (
          <div className={styles.timeline}>
            {financialActivity.map((item) => {
              const evidence = parseEvidence(item.evidence);
              const meta = evidence.product ? PRODUCT_META[evidence.product] : undefined;
              return <div className={styles.timelineItem} key={item.id}>
                <span className={styles.timelineIcon}>{item.event_type.includes("withdraw") || item.event_type.includes("unlock") ? <ArrowDownToLine size={17} /> : <Clock3 size={17} />}</span>
                <div><strong>{EVENT_LABELS[item.event_type] || item.event_type}</strong><p>{meta?.label || evidence.product || "On-chain position"}{evidence.positionId ? ` · Position #${evidence.positionId}` : ""}</p></div>
                <div className={styles.timelineRight}>{meta && evidence.principal ? <strong>{formatAtomic(evidence.principal, meta.decimals)} {meta.symbol}</strong> : null}<span>{formatDate(item.occurred_at)}</span></div>
              </div>;
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default function History() {
  return (
    <div className={styles.uxPage}>
      <div className={styles.hero}><span>ON-CHAIN HISTORY</span><h2>One timeline for your Unlimited X positions.</h2><p>Track indexed Earn and Stake positions plus verified lifecycle activity from BNB Chain.</p></div>
      <HistoryContent />
    </div>
  );
}
