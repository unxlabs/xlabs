import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getMyRewardHistory, type RewardHistoryEvent } from "@/shared/api/rewards";
import { useAuth } from "@/shared/auth/AuthProvider";

import styles from "./History.module.css";

const EVENT_LABELS: Record<string, string> = {
  allocation_calculated: "Allocation calculated",
  allocation_approved: "Allocation approved",
  entitlement_created: "Reward created",
  entitlement_approved: "Reward approved",
  entitlement_claimable: "Reward ready",
  delivery_started: "Delivery started",
  delivery_submitted: "Delivery submitted",
  delivery_confirmed: "Delivery confirmed",
  delivery_failed: "Delivery attempt failed",
  entitlement_claimed: "Reward delivered",
  entitlement_cancelled: "Reward cancelled",
};

function labelFor(event: RewardHistoryEvent) {
  return EVENT_LABELS[event.event_type] || event.event_type.replaceAll("_", " ");
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function eventTone(type: string) {
  if (type.includes("failed") || type.includes("cancelled")) return "warning";
  if (type.includes("confirmed") || type.includes("claimed")) return "success";
  if (type.includes("approved") || type.includes("claimable")) return "ready";
  return "neutral";
}

export default function History() {
  const { isAuthenticated, authenticate, isAuthenticating, isRestoring } = useAuth();
  const [events, setEvents] = useState<RewardHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getMyRewardHistory();
      setEvents(response.events);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reward history.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) void load();
    else setEvents([]);
  }, [isAuthenticated, load]);

  const groups = useMemo(() => {
    const result = new Map<string, RewardHistoryEvent[]>();
    for (const event of events) {
      const key = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long" }).format(new Date(event.occurred_at));
      const list = result.get(key) ?? [];
      list.push(event);
      result.set(key, list);
    }
    return Array.from(result.entries());
  }, [events]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>PROOF OF PARTICIPATION</div>
          <h1>Your history compounds.</h1>
          <p>A transparent timeline of reward decisions and delivery events tied to your account.</p>
        </div>
        <Link to="/app/rewards">Back to rewards →</Link>
      </section>

      {!isAuthenticated ? (
        <section className={styles.gate}>
          <h2>Your timeline is wallet-linked</h2>
          <p>Sign in to load your private reward history.</p>
          <button type="button" onClick={() => void authenticate()} disabled={isAuthenticating || isRestoring}>
            {isAuthenticating ? "Check your wallet…" : isRestoring ? "Restoring session…" : "Sign in to continue"}
          </button>
        </section>
      ) : (
        <section className={styles.timelineWrap}>
          <div className={styles.toolbar}>
            <div><strong>{events.length}</strong><span> recorded events</span></div>
            <button type="button" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          {!loading && !error && events.length === 0 ? (
            <div className={styles.empty}>
              <h2>No reward events yet.</h2>
              <p>When you qualify for a reward, its lifecycle will appear here instead of disappearing behind a black box.</p>
              <Link to="/app/season">Start building XP →</Link>
            </div>
          ) : null}

          {groups.map(([month, monthEvents]) => (
            <div className={styles.month} key={month}>
              <h2>{month}</h2>
              <div className={styles.timeline}>
                {monthEvents.map((event) => {
                  const tone = eventTone(event.event_type);
                  return (
                    <article className={styles.event} key={event.id}>
                      <div className={`${styles.dot} ${styles[tone]}`} />
                      <div className={styles.eventBody}>
                        <div className={styles.eventTop}>
                          <strong>{labelFor(event)}</strong>
                          <time>{formatDate(event.occurred_at)}</time>
                        </div>
                        <div className={styles.eventMeta}>
                          <span>{event.actor_type === "system" ? "Verified by system" : `Actor: ${event.actor_type}`}</span>
                          {event.entitlement_id ? <span>Reward {event.entitlement_id.slice(0, 8)}…</span> : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
