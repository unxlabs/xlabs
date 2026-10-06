import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Circle, Flag, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getCampaign, joinCampaign, syncCampaign, type CampaignMission, type CampaignRecord } from "@/shared/api/campaigns";
import { useAuth } from "@/shared/auth/AuthProvider";
import styles from "./Campaigns.module.css";

function Objective({ mission }: { mission: CampaignMission }) {
  return <article className={`${styles.objective} ${mission.completed ? styles.objectiveDone : ""}`}>
    <div className={styles.objectiveIcon}>{mission.completed ? <Check size={16}/> : <Circle size={16}/>}</div>
    <div className={styles.objectiveCopy}><div className={styles.objectiveTitle}><strong>{mission.name}</strong><span>{mission.required ? "Required" : "Optional"}</span></div><p>{mission.description || "Verified participation objective."}</p><small>{mission.baseXp.toLocaleString()} mission XP · {mission.completed ? "Verified" : "Not completed"}</small></div>
  </article>;
}

export default function CampaignDetail() {
  const { slug = "" } = useParams();
  const { isAuthenticated, isAuthenticating, isRestoring, authenticate } = useAuth();
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || !slug) return;
    setLoading(true); setError(null);
    try { setCampaign((await getCampaign(slug)).campaign); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load campaign."); }
    finally { setLoading(false); }
  }, [isAuthenticated, slug]);
  useEffect(() => { void load(); }, [load]);

  const required = useMemo(() => campaign?.progress?.missions.filter((m) => m.required) ?? [], [campaign]);
  const optional = useMemo(() => campaign?.progress?.missions.filter((m) => !m.required) ?? [], [campaign]);
  const progress = campaign?.progress;
  const percent = progress?.requiredTotal ? Math.round((progress.requiredCompleted / progress.requiredTotal) * 100) : 0;

  const act = async (mode: "join" | "sync") => {
    if (!campaign) return;
    setActing(true); setError(null);
    try { setCampaign((await (mode === "join" ? joinCampaign(campaign.slug) : syncCampaign(campaign.slug))).campaign); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update campaign."); }
    finally { setActing(false); }
  };

  if (!isAuthenticated) return <div className={styles.page}><section className={styles.guestHero}><span className={styles.eyebrow}>CAMPAIGN ACCESS</span><h1>Build your participation record.</h1><p>Sign in with your wallet to view campaign objectives and verified progress.</p><button className={styles.primaryButton} type="button" onClick={() => void authenticate()} disabled={isAuthenticating || isRestoring}>{isAuthenticating || isRestoring ? <LoaderCircle size={18} className={styles.spin}/> : <Flag size={18}/>} Sign in with wallet</button></section></div>;

  return <div className={styles.page}>
    <Link className={styles.back} to="/app/campaigns"><ArrowLeft size={15}/> All campaigns</Link>
    {error ? <div className={styles.error}>{error}</div> : null}
    {loading && !campaign ? <div className={styles.loading}><LoaderCircle size={22} className={styles.spin}/> Loading campaign…</div> : null}
    {campaign ? <>
      <section className={styles.detailHero}>
        <div className={styles.detailHeroCopy}><div className={styles.detailBadges}><span>{campaign.campaignType}</span><span>{campaign.windowState}</span>{campaign.participant?.status ? <span>{campaign.participant.status}</span> : null}</div><h1>{campaign.name}</h1><p>{campaign.description || "Complete verified objectives and build your participation record."}</p></div>
        <div className={styles.detailAction}>
          {campaign.participant?.status === "completed" ? <div className={styles.completedPill}><CheckCircle2 size={18}/> Campaign completed</div> : campaign.participant ? <button className={styles.primaryButton} type="button" onClick={() => void act("sync")} disabled={acting}>{acting ? <LoaderCircle size={17} className={styles.spin}/> : <RefreshCw size={17}/>} Sync progress</button> : <button className={styles.primaryButton} type="button" onClick={() => void act("join")} disabled={acting || campaign.windowState !== "live" || campaign.requirements?.eligible === false}>{acting ? <LoaderCircle size={17} className={styles.spin}/> : <Flag size={17}/>} Join campaign</button>}
        </div>
      </section>

      <section className={styles.progressPanel}>
        <div className={styles.progressSummary}><div><span>REQUIRED PROGRESS</span><strong>{progress?.requiredCompleted ?? 0}/{progress?.requiredTotal ?? 0}</strong></div><div><span>OPTIONAL</span><strong>{progress?.optionalCompleted ?? 0}/{progress?.optionalTotal ?? 0}</strong></div><div><span>VERIFIED SCORE</span><strong>{progress?.score ?? campaign.participant?.score ?? 0}</strong></div></div>
        <div className={styles.bigTrack}><span style={{width:`${percent}%`}}/></div><div className={styles.bigTrackFoot}><span>{percent}% of required objectives verified</span><strong>{progress?.complete ? "Requirements complete" : "Keep progressing"}</strong></div>
      </section>

      {campaign.requirements && campaign.requirements.checks.length > 0 ? <section className={styles.requirements}><div className={styles.sectionHead}><div><span>ACCESS</span><h2>Campaign requirements</h2></div><LockKeyhole size={20}/></div>{campaign.requirements.checks.map((check) => <div className={styles.requirementRow} key={check.key}><span>{check.key}</span><strong>{String(check.actual ?? "—")} / {String(check.required)}</strong><em>{check.passed ? "Passed" : "Required"}</em></div>)}</section> : null}

      <section className={styles.objectiveSection}><div className={styles.sectionHead}><div><span>CORE PATH</span><h2>Required objectives</h2></div><Target size={20}/></div><div className={styles.objectiveList}>{required.map((mission) => <Objective mission={mission} key={mission.missionId}/>)}</div></section>
      {optional.length ? <section className={styles.objectiveSection}><div className={styles.sectionHead}><div><span>GO FURTHER</span><h2>Optional objectives</h2></div><Sparkles size={20}/></div><div className={styles.objectiveList}>{optional.map((mission) => <Objective mission={mission} key={mission.missionId}/>)}</div></section> : null}

      <section className={styles.notice}><ShieldCheck size={19}/><div><strong>Verified activity only.</strong><p>Campaign progress is derived from trusted mission completions. Campaign completion does not by itself guarantee an airdrop, token allocation or reward.</p></div></section>
    </> : null}
  </div>;
}
