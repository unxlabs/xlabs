import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getMyRewards, type RewardEntitlement, type RewardProfile } from "@/shared/api/rewards";
import { useAuth } from "@/shared/auth/AuthProvider";

import styles from "./Rewards.module.css";

function formatDate(value: number | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function rewardAmount(reward: RewardEntitlement) {
  if (!reward.amount_atomic) return reward.reward_type === "badge" ? "Badge" : "Reward";
  return `${reward.amount_atomic} ${reward.asset_symbol || "units"}`;
}

function statusCopy(status: string) {
  switch (status) {
    case "pending": return "Pending review";
    case "approved": return "Approved";
    case "claimable": return "Ready";
    case "processing": return "Processing";
    case "claimed": return "Delivered";
    case "cancelled": return "Cancelled";
    default: return status.replaceAll("_", " ");
  }
}

function isInternalTest(reward: RewardEntitlement) {
  return reward.program_key.startsWith("production-test-") || reward.metadata?.internalTest === true;
}

export default function Rewards() {
  const { isAuthenticated, authenticate, isAuthenticating, isRestoring } = useAuth();
  const [profile, setProfile] = useState<RewardProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getMyRewards();
      setProfile(response.rewards);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load rewards.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) void load();
    else setProfile(null);
  }, [isAuthenticated, load]);

  const visibleRewards = useMemo(
    () => (profile?.entitlements ?? []).filter((reward) => !isInternalTest(reward)),
    [profile],
  );

  const summary = useMemo(() => {
    const result = { total: 0, active: 0, ready: 0, delivered: 0 };
    for (const reward of visibleRewards) {
      result.total += 1;
      if (["pending", "approved", "processing"].includes(reward.status)) result.active += 1;
      if (reward.status === "claimable") result.ready += 1;
      if (reward.status === "claimed") result.delivered += 1;
    }
    return result;
  }, [visibleRewards]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>PARTICIPATION ECONOMY</div>
          <h1>Your contribution should compound.</h1>
          <p>
            Rewards are earned through verified participation — not empty clicks. Build history,
            qualify for programs, and track every reward from approval to delivery.
          </p>
        </div>
        <Link className={styles.historyLink} to="/app/history">View reward history →</Link>
      </section>

      {!isAuthenticated ? (
        <section className={styles.gate}>
          <div className={styles.gateIcon}>✦</div>
          <h2>Unlock your reward profile</h2>
          <p>Sign in with your connected wallet to see verified eligibility and reward status.</p>
          <button type="button" onClick={() => void authenticate()} disabled={isAuthenticating || isRestoring}>
            {isAuthenticating ? "Check your wallet…" : isRestoring ? "Restoring session…" : "Sign in to continue"}
          </button>
        </section>
      ) : (
        <>
          <section className={styles.metrics}>
            <div><span>Total rewards</span><strong>{summary.total}</strong></div>
            <div><span>In progress</span><strong>{summary.active}</strong></div>
            <div><span>Ready</span><strong>{summary.ready}</strong></div>
            <div><span>Delivered</span><strong>{summary.delivered}</strong></div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <span>YOUR REWARDS</span>
                <h2>Earned through participation</h2>
              </div>
              <button type="button" className={styles.refresh} onClick={() => void load()} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            {!loading && !error && visibleRewards.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyMark}>0 → 1</div>
                <h3>Your first verified reward starts with participation.</h3>
                <p>Complete missions, build XP, use live products and join campaigns as they open.</p>
                <div className={styles.emptyActions}>
                  <Link to="/app/season">Build XP</Link>
                  <Link to="/app/campaigns">Explore campaigns</Link>
                </div>
              </div>
            ) : null}

            <div className={styles.rewardList}>
              {visibleRewards.map((reward) => (
                <article className={styles.rewardCard} key={reward.id}>
                  <div className={styles.rewardTop}>
                    <div>
                      <span className={styles.program}>{reward.program_name}</span>
                      <h3>{rewardAmount(reward)}</h3>
                    </div>
                    <span className={`${styles.status} ${styles[`status_${reward.status}`] ?? ""}`}>
                      {statusCopy(reward.status)}
                    </span>
                  </div>

                  <div className={styles.rewardMeta}>
                    <div><span>Type</span><strong>{reward.reward_type.replaceAll("_", " ")}</strong></div>
                    <div><span>Earned</span><strong>{formatDate(reward.earned_at)}</strong></div>
                    <div><span>Distribution</span><strong>{reward.distribution_mode}</strong></div>
                  </div>

                  {reward.status === "claimable" ? (
                    <div className={styles.notice}>
                      This reward is eligible for delivery. On-chain claiming will appear here only when its distributor is activated.
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className={styles.philosophy}>
            <span>HOW XLAP THINKS</span>
            <h2>XP proves you. Genesis boosts you. XLAP empowers you.</h2>
            <p>Your history matters, but XP is not a fixed token conversion. Eligibility, quality, consistency and verified contribution shape future allocations.</p>
          </section>
        </>
      )}
    </div>
  );
}
