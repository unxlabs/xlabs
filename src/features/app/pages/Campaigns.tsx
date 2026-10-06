import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Flag, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { getMyCampaigns, type CampaignRecord } from "@/shared/api/campaigns";
import { useAuth } from "@/shared/auth/AuthProvider";
import styles from "./Campaigns.module.css";

function progressPercent(campaign: CampaignRecord) {
  const progress = campaign.progress;
  if (!progress || progress.requiredTotal === 0) return 0;
  return Math.round((progress.requiredCompleted / progress.requiredTotal) * 100);
}

function stateLabel(campaign: CampaignRecord) {
  if (campaign.participant?.status === "completed") return "Completed";
  if (campaign.participant?.status === "active") return "In progress";
  if (campaign.windowState === "upcoming") return "Upcoming";
  if (campaign.windowState === "ended") return "Ended";
  if (campaign.windowState === "paused") return "Paused";
  return "Open";
}

function CampaignCard({ campaign }: { campaign: CampaignRecord }) {
  const progress = campaign.progress;
  const percent = progressPercent(campaign);
  return (
    <Link to={`/app/campaigns/${encodeURIComponent(campaign.slug)}`} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.type}>{campaign.campaignType}</span>
        <span className={`${styles.state} ${campaign.participant?.status === "completed" ? styles.completeState : ""}`}>
          {campaign.participant?.status === "completed" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
          {stateLabel(campaign)}
        </span>
      </div>
      <div className={styles.cardCopy}>
        <h3>{campaign.name}</h3>
        <p>{campaign.description || "Complete verified objectives and build your participation record."}</p>
      </div>
      {progress ? (
        <div className={styles.cardProgress}>
          <div className={styles.progressLine}><span>Required progress</span><strong>{progress.requiredCompleted}/{progress.requiredTotal}</strong></div>
          <div className={styles.track}><span style={{ width: `${percent}%` }} /></div>
          <div className={styles.progressFoot}><span>{progress.optionalCompleted}/{progress.optionalTotal} optional</span><span>{progress.score} verified objectives</span></div>
        </div>
      ) : <div className={styles.cardProgress}><span className={styles.muted}>Open campaign to view objectives.</span></div>}
      <div className={styles.openLine}>View campaign <ArrowRight size={15} /></div>
    </Link>
  );
}

export default function Campaigns() {
  const { isAuthenticated, isAuthenticating, isRestoring, authenticate } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError(null);
    try { setCampaigns((await getMyCampaigns()).campaigns); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load campaigns."); }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => ({
    active: campaigns.filter((c) => c.participant?.status === "active" || (!c.participant && c.windowState === "live")),
    upcoming: campaigns.filter((c) => c.windowState === "upcoming"),
    completed: campaigns.filter((c) => c.participant?.status === "completed"),
    ended: campaigns.filter((c) => c.windowState === "ended" && c.participant?.status !== "completed"),
  }), [campaigns]);

  if (!isAuthenticated) return (
    <div className={styles.page}><section className={styles.guestHero}>
      <span className={styles.eyebrow}>VERIFIED PARTICIPATION</span><h1>Campaigns</h1>
      <p>Join focused participation tracks, complete verified objectives and build a stronger onchain record across Unlimited X Labs.</p>
      <button className={styles.primaryButton} type="button" onClick={() => void authenticate()} disabled={isAuthenticating || isRestoring}>
        {isAuthenticating || isRestoring ? <LoaderCircle size={18} className={styles.spin} /> : <Flag size={18} />}
        {isRestoring ? "Restoring session…" : isAuthenticating ? "Signing in…" : "Sign in with wallet"}
      </button>
    </section></div>
  );

  return <div className={styles.page}>
    <section className={styles.hero}>
      <div><span className={styles.eyebrow}>PARTICIPATION TRACKS</span><h1>Campaigns</h1><p>Focused paths that turn verified activity into visible progress. Complete required objectives, push further with optional goals, and build your participation history.</p></div>
      <button className={styles.refreshButton} type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={17} className={loading ? styles.spin : undefined} /> Refresh</button>
    </section>

    <section className={styles.signalGrid}>
      <article><Target size={19}/><div><strong>{groups.active.length}</strong><span>Active tracks</span></div></article>
      <article><ShieldCheck size={19}/><div><strong>{groups.completed.length}</strong><span>Completed</span></div></article>
      <article><Sparkles size={19}/><div><strong>{campaigns.length}</strong><span>Visible to you</span></div></article>
    </section>

    {error ? <div className={styles.error}>{error}</div> : null}
    {loading && campaigns.length === 0 ? <div className={styles.loading}><LoaderCircle size={22} className={styles.spin}/> Loading campaigns…</div> : null}

    {!loading && campaigns.length === 0 ? <section className={styles.empty}><Flag size={25}/><h2>No campaigns are open right now.</h2><p>New participation tracks will appear here when they become available to your account.</p></section> : null}

    {(["active","upcoming","completed","ended"] as const).map((key) => groups[key].length ? <section className={styles.section} key={key}>
      <div className={styles.sectionHead}><div><span>{key === "active" ? "NOW" : key.toUpperCase()}</span><h2>{key === "active" ? "Active campaigns" : key.charAt(0).toUpperCase()+key.slice(1)}</h2></div><small>{groups[key].length}</small></div>
      <div className={styles.grid}>{groups[key].map((campaign) => <CampaignCard campaign={campaign} key={campaign.id}/>)}</div>
    </section> : null)}

    <section className={styles.notice}><ShieldCheck size={19}/><div><strong>Participation is not a token allocation.</strong><p>Campaign progress records verified participation. Final airdrop eligibility, allocation and distribution rules remain separate.</p></div></section>
  </div>;
}
