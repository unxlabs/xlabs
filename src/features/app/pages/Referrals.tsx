import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, LoaderCircle, RefreshCw, Users } from "lucide-react";

import styles from "./Referrals.module.css";
import { useAuth } from "@/shared/auth/AuthProvider";
import {
  attachReferralCode,
  getReferralProfile,
  type ReferralNetworkMember,
  type ReferralProfileResponse,
  type ReferralStage,
} from "@/shared/api/referrals";

const STAGE_LABELS: Record<ReferralStage, string> = {
  joined: "Joined",
  activated: "Activated",
  engaged: "Engaged",
  qualified: "Qualified",
  blocked: "Blocked",
};

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function NetworkRow({ member }: { member: ReferralNetworkMember }) {
  return (
    <div className={styles.networkRow}>
      <div>
        <strong>{member.username || shortAddress(member.walletAddress)}</strong>
        <span>{formatDate(member.joinedAt)}</span>
      </div>
      <span className={`${styles.stageBadge} ${styles[member.status]}`}>
        {STAGE_LABELS[member.status]}
      </span>
    </div>
  );
}

export default function Referrals() {
  const { isAuthenticated, isAuthenticating, isRestoring, authenticate } = useAuth();
  const [profile, setProfile] = useState<ReferralProfileResponse | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      setProfile(await getReferralProfile());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load referrals.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const inviteUrl = useMemo(() => {
    if (!profile?.referralCode) return "";
    return `${window.location.origin}/app/referrals?ref=${encodeURIComponent(profile.referralCode)}`;
  }, [profile?.referralCode]);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setCode(ref.toUpperCase());
  }, []);

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const submitReferral = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || submitting) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await attachReferralCode(cleanCode);
      setMessage(result.created ? "Referral connected successfully." : "This referral is already connected.");
      setCode("");
      await loadProfile();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to connect referral.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Growth Network</span>
          <h1>Referrals</h1>
          <p>Sign in once to access your referral code, network progress and Genesis referral boost.</p>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => void authenticate()}
            disabled={isAuthenticating || isRestoring}
          >
            {isAuthenticating || isRestoring ? <LoaderCircle size={18} /> : <Link2 size={18} />}
            {isRestoring ? "Restoring session…" : isAuthenticating ? "Signing in…" : "Sign in with wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <span className={styles.eyebrow}>Growth Network</span>
          <h1>Referrals</h1>
          <p>Invite real participants. Referral quality grows as they become active in Unlimited X Labs.</p>
        </div>
        <button className={styles.refreshButton} type="button" onClick={() => void loadProfile()} disabled={loading}>
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {message ? <div className={styles.success}>{message}</div> : null}

      {loading && !profile ? (
        <div className={styles.loadingCard}><LoaderCircle size={22} /> Loading referral profile…</div>
      ) : profile ? (
        <>
          <div className={styles.topGrid}>
            <section className={styles.card}>
              <span className={styles.cardLabel}>Your referral code</span>
              <div className={styles.code}>{profile.referralCode}</div>
              <button className={styles.primaryButton} type="button" onClick={() => void copyInvite()}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy invite link"}
              </button>
              <p className={styles.hint}>Your code identifies your network. Rewards depend on quality progression, not wallet connection alone.</p>
            </section>

            <section className={styles.card}>
              <span className={styles.cardLabel}>Genesis referral boost</span>
              <div className={styles.bigMetric}>+{profile.referralBoost.percent}%</div>
              <strong>{profile.referralBoost.genesisTierName}</strong>
              <p className={styles.hint}>Applied to eligible referral XP when the backend awards it.</p>
            </section>

            <section className={styles.card}>
              <span className={styles.cardLabel}>Your referrer</span>
              {profile.referredBy ? (
                <>
                  <div className={styles.bigMetricSmall}>{STAGE_LABELS[profile.referredBy.relationship.status]}</div>
                  <strong>{profile.referredBy.referrer?.username || profile.referredBy.referrer?.referralCode || "Connected"}</strong>
                  <p className={styles.hint}>Referral relationships are permanent after they are attached.</p>
                </>
              ) : (
                <>
                  <div className={styles.inputRow}>
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value.toUpperCase())}
                      placeholder="Enter invite code"
                      autoCapitalize="characters"
                      autoComplete="off"
                    />
                    <button type="button" onClick={() => void submitReferral()} disabled={!code.trim() || submitting}>
                      {submitting ? <LoaderCircle size={17} /> : "Connect"}
                    </button>
                  </div>
                  <p className={styles.hint}>You can attach one referrer only. This cannot be changed later.</p>
                </>
              )}
            </section>
          </div>

          <section className={styles.statsGrid}>
            <div><span>Total</span><strong>{profile.stats.total}</strong></div>
            <div><span>Joined</span><strong>{profile.stats.joined}</strong></div>
            <div><span>Activated</span><strong>{profile.stats.activated}</strong></div>
            <div><span>Engaged</span><strong>{profile.stats.engaged}</strong></div>
            <div><span>Qualified</span><strong>{profile.stats.qualified}</strong></div>
          </section>

          <section className={styles.networkCard}>
            <div className={styles.networkHeader}>
              <div>
                <span className={styles.cardLabel}>Your network</span>
                <h2>Referral progress</h2>
              </div>
              <Users size={22} />
            </div>

            <div className={styles.stagePath}>
              <span>Joined</span><i />
              <span>Activated</span><i />
              <span>Engaged</span><i />
              <span>Qualified</span>
            </div>

            {profile.network.length > 0 ? (
              <div className={styles.networkList}>
                {profile.network.map((member) => <NetworkRow key={member.referralId} member={member} />)}
              </div>
            ) : (
              <div className={styles.emptyState}>No referrals yet. Share your invite link to start building your network.</div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
