import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  CircleDot,
  Flame,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

import { useAuth } from "@/shared/auth/AuthProvider";
import { getMyProgression, type ProgressionSnapshot } from "@/shared/api/progression";
import { getMyNextMove, type NextMove } from "@/shared/api/nextMove";
import { getSeasonLeaderboard, type LeaderboardMe } from "@/shared/api/leaderboard";
import {
  getMyEligibility,
  syncMyEligibility,
  type EligibilityEvaluationRecord,
} from "@/shared/api/eligibility";
import {
  getCurrentSeason,
  getMyMissions,
  getPublicMissions,
  joinCurrentSeason,
  type MissionRecord,
  type SeasonParticipation,
  type SeasonRecord,
} from "@/shared/api/season";

import styles from "./Season.module.css";

function formatDate(value: number | null) {
  if (!value) return "Open-ended";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function missionState(mission: MissionRecord) {
  const completed = (mission.verifiedCompletionCount ?? 0) > 0;
  if (completed) return "Verified";
  if (!mission.availableNow) return "Unavailable";
  return "Available";
}

const STEP_META: Record<string, { label: string; to: string }> = {
  portfolio: { label: "Portfolio", to: "/app" },
  earn: { label: "Earn", to: "/app/earn" },
  stake: { label: "Stake", to: "/app/stake" },
  genesis: { label: "Genesis Pass", to: "/app/genesis" },
};

function stepMeta(stepKey: string) {
  return STEP_META[stepKey] ?? { label: stepKey, to: "/app/airdrop" };
}

function visibleNextMove(nextMove: NextMove | null): NextMove | null {
  if (!nextMove) return null;
  if (nextMove.key !== "join_season") {
    return {
      ...nextMove,
      href: nextMove.href === "/app/season" ? "/app/airdrop" : nextMove.href,
    };
  }

  return {
    ...nextMove,
    title: "Join the Airdrop journey",
    description: "Activate your participation so verified activity can build your current campaign progress.",
    ctaLabel: "Join Airdrop",
    href: "/app/airdrop",
  };
}

export default function Season() {
  const {
    isAuthenticated,
    isAuthenticating,
    isRestoring,
    authenticate,
    error: authError,
  } = useAuth();

  const [season, setSeason] = useState<SeasonRecord | null>(null);
  const [participation, setParticipation] = useState<SeasonParticipation | null>(null);
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [progression, setProgression] = useState<ProgressionSnapshot | null>(null);
  const [nextMove, setNextMove] = useState<NextMove | null>(null);
  const [leaderboardMe, setLeaderboardMe] = useState<LeaderboardMe | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityEvaluationRecord[]>([]);
  const [syncingEligibility, setSyncingEligibility] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        const [result, progressionResult, nextMoveResult, leaderboardResult, eligibilityResult] = await Promise.all([
          getMyMissions(),
          getMyProgression(),
          getMyNextMove(),
          getSeasonLeaderboard(),
          getMyEligibility(),
        ]);
        setSeason(result.season);
        setParticipation(result.participation);
        setMissions(result.missions);
        setProgression(progressionResult.progression);
        setNextMove(nextMoveResult.nextMove);
        setLeaderboardMe(leaderboardResult.me);
        setEligibility(eligibilityResult.evaluations);
      } else {
        const [seasonResult, missionResult] = await Promise.all([
          getCurrentSeason(),
          getPublicMissions(),
        ]);
        setSeason(seasonResult.season);
        setParticipation(null);
        setMissions(missionResult.missions);
        setProgression(null);
        setNextMove(null);
        setLeaderboardMe(null);
        setEligibility([]);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the Airdrop page.",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const completedCount = useMemo(
    () => missions.filter((mission) => (mission.verifiedCompletionCount ?? 0) > 0).length,
    [missions],
  );

  const weeklyStreak = useMemo(
    () => progression?.streaks.find((streak) => streak.streak_type === "weekly_participation") ?? null,
    [progression],
  );

  const displayNextMove = useMemo(() => visibleNextMove(nextMove), [nextMove]);

  const airdropEligibility = useMemo(
    () => eligibility.find((item) => item.program.programType === "airdrop") ?? null,
    [eligibility],
  );

  const handleEligibilitySync = async () => {
    if (!isAuthenticated) return;
    setSyncingEligibility(true);
    setError(null);
    try {
      const result = await syncMyEligibility();
      setEligibility(result.evaluations);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Unable to refresh eligibility.");
    } finally {
      setSyncingEligibility(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) return;

    setJoining(true);
    setError(null);

    try {
      const result = await joinCurrentSeason();
      setSeason(result.season);
      setParticipation(result.participation);

      const [missionResult, progressionResult, nextMoveResult, leaderboardResult, eligibilityResult] = await Promise.all([
        getMyMissions(),
        getMyProgression(),
        getMyNextMove(),
        getSeasonLeaderboard(),
        getMyEligibility(),
      ]);
      setSeason(missionResult.season);
      setParticipation(missionResult.participation);
      setMissions(missionResult.missions);
      setProgression(progressionResult.progression);
      setNextMove(nextMoveResult.nextMove);
      setLeaderboardMe(leaderboardResult.me);
      setEligibility(eligibilityResult.evaluations);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Unable to join the Airdrop journey.",
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>AIRDROP · {season?.name ?? "CURRENT CAMPAIGN"}</div>
          <h1>Airdrop</h1>
          <p>
            Build a verified participation history through missions, XP, streaks and ecosystem activity.
            Your progress strengthens your participation record as the campaign evolves.
          </p>
          <div className={styles.heroMeta}>
            <span><CircleDot size={14} /> {season?.status === "active" ? "Live" : season?.status ?? "Preparing"}</span>
            <span>Ends {formatDate(season?.endsAt ?? null)}</span>
          </div>
        </div>

        <div className={styles.heroActions}>
          {participation ? (
            <div className={styles.joinedPill}>
              <CheckCircle2 size={18} /> Participating
            </div>
          ) : isAuthenticated ? (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => void handleJoin()}
              disabled={joining || !season}
            >
              {joining ? <LoaderCircle size={18} className={styles.spin} /> : <CircleDot size={18} />}
              {joining ? "Joining…" : "Join Airdrop"}
            </button>
          ) : (
            <ConnectButton.Custom>
              {({ account, chain, mounted, openConnectModal }) => {
                const connected = mounted && Boolean(account && chain);
                const busy = isAuthenticating || isRestoring;

                const handleAuthClick = async () => {
                  if (!mounted || busy) return;
                  if (!connected) {
                    openConnectModal?.();
                    return;
                  }
                  await authenticate();
                };

                return (
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => void handleAuthClick()}
                    disabled={!mounted || busy}
                  >
                    {busy ? <LoaderCircle size={18} className={styles.spin} /> : connected ? <CircleDot size={18} /> : <Wallet size={18} />}
                    {isRestoring ? "Checking session…" : isAuthenticating ? "Signing in…" : connected ? "Sign in" : "Connect Wallet"}
                  </button>
                );
              }}
            </ConnectButton.Custom>
          )}

          <button
            className={styles.refreshButton}
            type="button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh Airdrop progress"
          >
            <RefreshCw size={18} className={loading ? styles.spin : undefined} />
          </button>
        </div>
      </section>

      {error || authError ? <div className={styles.error}>{error ?? authError}</div> : null}

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>Airdrop status</span>
          <strong>{participation?.status === "active" ? "Active" : isAuthenticated ? "Ready to join" : "Sign in"}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Campaign XP</span>
          <strong>{(participation?.seasonXp ?? 0).toLocaleString()}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Verified missions</span>
          <strong>{completedCount}/{missions.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Weekly streak</span>
          <strong>{weeklyStreak ? `${weeklyStreak.current_count} week${weeklyStreak.current_count === 1 ? "" : "s"}` : "—"}</strong>
        </div>
        <Link className={`${styles.statCard} ${styles.rankStatCard}`} to="/app/leaderboard">
          <span>Live rank</span>
          <strong>{leaderboardMe ? `#${leaderboardMe.rank}` : "—"}</strong>
          <small>View leaderboard <ArrowUpRight size={12} /></small>
        </Link>
      </section>

      {isAuthenticated ? (
        <section className={styles.eligibilityCard}>
          <div className={styles.eligibilityHeader}>
            <div className={styles.eligibilityTitle}>
              <span className={styles.eligibilityIcon}><ShieldCheck size={20} /></span>
              <div>
                <div className={styles.eyebrowDark}>AIRDROP ELIGIBILITY</div>
                <h2>{airdropEligibility?.program.name ?? "Eligibility record"}</h2>
              </div>
            </div>
            <button
              className={styles.eligibilitySync}
              type="button"
              onClick={() => void handleEligibilitySync()}
              disabled={syncingEligibility}
            >
              <RefreshCw size={15} className={syncingEligibility ? styles.spin : undefined} />
              {syncingEligibility ? "Checking…" : "Check eligibility"}
            </button>
          </div>

          {airdropEligibility?.evaluation ? (
            <>
              <div className={styles.eligibilitySummary}>
                <div className={`${styles.eligibilityStatus} ${styles[`eligibility_${airdropEligibility.evaluation.result}`]}`}>
                  {airdropEligibility.evaluation.result === "eligible" ? <CheckCircle2 size={18} /> : <ShieldQuestion size={18} />}
                  <div>
                    <span>Current result</span>
                    <strong>{airdropEligibility.evaluation.result === "eligible" ? "Eligible" : airdropEligibility.evaluation.result === "review" ? "Under review" : airdropEligibility.evaluation.result === "excluded" ? "Excluded" : "Not eligible yet"}</strong>
                  </div>
                </div>
                <div className={styles.requiredScore}>
                  <span>Required checks</span>
                  <strong>{airdropEligibility.evaluation.passedRequired}/{airdropEligibility.evaluation.totalRequired}</strong>
                </div>
                <div className={styles.evaluatedAt}>
                  <span>Last evaluated</span>
                  <strong>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(airdropEligibility.evaluation.evaluatedAt))}</strong>
                </div>
              </div>

              <div className={styles.ruleGrid}>
                {airdropEligibility.evaluation.rules.map((rule) => (
                  <div className={styles.ruleItem} key={rule.ruleId}>
                    <span className={`${styles.ruleMark} ${rule.passed ? styles.rulePassed : ""}`}>
                      {rule.passed ? <CheckCircle2 size={15} /> : <CircleDot size={15} />}
                    </span>
                    <div className={styles.ruleCopy}>
                      <div className={styles.ruleName}>
                        <strong>{rule.name}</strong>
                        <span>{rule.required ? "Required" : "Optional"}</span>
                      </div>
                      <p>{rule.passed ? "Verified" : "Not yet satisfied"}{rule.observedValue !== null && rule.targetValue !== null ? ` · ${rule.observedValue.toLocaleString()} / ${rule.targetValue.toLocaleString()}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.eligibilityEmpty}>
              <ShieldQuestion size={22} />
              <div>
                <strong>No eligibility evaluation yet</strong>
                <p>Check your eligibility to evaluate your current verified participation against the active rules.</p>
              </div>
            </div>
          )}

          <div className={styles.eligibilityFoot}>
            Eligibility is a verified participation check, not a token allocation or payment promise. Final allocation and distribution remain separate.
          </div>
        </section>
      ) : null}

      {isAuthenticated && progression?.currentLevel ? (
        <>
          <section className={styles.progressionCard}>
            <div className={styles.progressionMain}>
              <div className={styles.progressionHeading}>
                <div>
                  <div className={styles.eyebrowDark}>YOUR PROGRESSION</div>
                  <div className={styles.levelLine}>
                    <span className={styles.levelIcon}><Sparkles size={18} /></span>
                    <h2>{progression.currentLevel.name}</h2>
                  </div>
                  <p className={styles.levelDescription}>{progression.currentLevel.description}</p>
                </div>
                <div className={styles.lifetimeXp}>
                  <span>Lifetime XP</span>
                  <strong>{progression.lifetimeXp.toLocaleString()}</strong>
                </div>
              </div>

              {progression.nextLevel ? (
                <>
                  <div className={styles.levelProgressRow}>
                    <span>Progress to <strong>{progression.nextLevel.name}</strong></span>
                    <strong>{progression.progress.progressPercent}%</strong>
                  </div>
                  <div className={styles.levelProgressTrack}>
                    <div className={styles.levelProgressFill} style={{ width: `${progression.progress.progressPercent}%` }} />
                  </div>
                  <div className={styles.levelProgressFoot}>
                    <span>{progression.lifetimeXp.toLocaleString()} XP</span>
                    <span>{progression.progress.xpToNextLevel.toLocaleString()} XP to {progression.nextLevel.name}</span>
                    <span>{progression.nextLevel.minLifetimeXp.toLocaleString()} XP</span>
                  </div>
                </>
              ) : (
                <div className={styles.maxLevel}><Trophy size={18} /> Highest progression level reached.</div>
              )}
            </div>

            <div className={styles.nextMovePreview}>
              <div className={styles.nextMoveIcon}><ArrowUpRight size={20} /></div>
              <div className={styles.nextMoveContent}>
                <span>YOUR NEXT BEST ACTION</span>
                {displayNextMove ? (
                  <>
                    <strong>{displayNextMove.title}</strong>
                    <p>{displayNextMove.description}</p>
                    <Link className={styles.nextMoveButton} to={displayNextMove.href}>
                      {displayNextMove.ctaLabel} <ArrowUpRight size={15} />
                    </Link>
                  </>
                ) : (
                  <>
                    <strong>Keep building verified activity</strong>
                    <p>Your next action will adapt as your participation history evolves.</p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className={styles.signalGrid}>
            <article className={`${styles.signalCard} ${styles.streakCard}`}>
              <div className={styles.signalIcon}><Flame size={20} /></div>
              <div>
                <span className={styles.signalLabel}>WEEKLY PARTICIPATION</span>
                <strong className={styles.signalValue}>{weeklyStreak?.current_count ?? 0} Week Streak</strong>
                <p>
                  {weeklyStreak
                    ? `Best: ${weeklyStreak.best_count} · Keep verified Earn or Stake participation active each week.`
                    : "Build your first verified weekly Earn or Stake participation streak."}
                </p>
              </div>
            </article>

            <article className={styles.signalCard}>
              <div className={styles.signalIcon}><Target size={20} /></div>
              <div>
                <span className={styles.signalLabel}>MILESTONES</span>
                <strong className={styles.signalValue}>{progression.milestones.length} Unlocked</strong>
                <p>Durable checkpoints earned from verified progress across Unlimited X Labs.</p>
              </div>
            </article>

            <article className={styles.signalCard}>
              <div className={styles.signalIcon}><Award size={20} /></div>
              <div>
                <span className={styles.signalLabel}>ACHIEVEMENTS</span>
                <strong className={styles.signalValue}>{progression.achievements.length} Earned</strong>
                <p>Recognition for meaningful participation, consistency and ecosystem activity.</p>
              </div>
            </article>
          </section>

          {(progression.milestones.length > 0 || progression.achievements.length > 0) ? (
            <section className={styles.unlockSection}>
              <div className={styles.sectionHead}>
                <div>
                  <div className={styles.eyebrowDark}>YOUR RECORD</div>
                  <h2>Unlocked progress</h2>
                </div>
                <ShieldCheck size={24} />
              </div>

              <div className={styles.unlockColumns}>
                <div className={styles.unlockGroup}>
                  <div className={styles.unlockGroupTitle}><Target size={17} /> Milestones</div>
                  {progression.milestones.length ? progression.milestones.map((milestone) => (
                    <div className={styles.unlockItem} key={milestone.id}>
                      <span className={styles.unlockMark}><CheckCircle2 size={16} /></span>
                      <div>
                        <strong>{milestone.name}</strong>
                        <p>{milestone.achieved_value.toLocaleString()} achieved · target {milestone.target_value.toLocaleString()}</p>
                      </div>
                    </div>
                  )) : <div className={styles.miniEmpty}>Your first milestone is still ahead.</div>}
                </div>

                <div className={styles.unlockGroup}>
                  <div className={styles.unlockGroupTitle}><Award size={17} /> Achievements</div>
                  {progression.achievements.length ? progression.achievements.map((achievement) => (
                    <div className={styles.unlockItem} key={achievement.id}>
                      <span className={styles.unlockMark}><Sparkles size={16} /></span>
                      <div>
                        <strong>{achievement.name}</strong>
                        <p>{achievement.rarity} · {achievement.category}</p>
                      </div>
                    </div>
                  )) : <div className={styles.miniEmpty}>Complete verified actions to earn achievements.</div>}
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.eyebrowDark}>MISSIONS</div>
            <h2>Build your participation</h2>
          </div>
          <div className={styles.count}>{missions.length} active</div>
        </div>

        {loading ? (
          <div className={styles.empty}><LoaderCircle size={22} className={styles.spin} /> Loading missions…</div>
        ) : missions.length === 0 ? (
          <div className={styles.empty}>No active missions are available right now.</div>
        ) : (
          <div className={styles.missionGrid}>
            {missions.map((mission) => {
              const state = missionState(mission);
              const verified = state === "Verified";

              return (
                <article className={styles.missionCard} key={mission.id}>
                  <div className={styles.missionTop}>
                    <span className={styles.category}>{mission.category}</span>
                    <span className={`${styles.state} ${verified ? styles.verified : ""}`}>{state}</span>
                  </div>
                  <h3>{mission.name}</h3>
                  <p>{mission.description || "Complete this mission to build your verified participation history."}</p>

                  <div className={styles.missionMeta}>
                    <span><Trophy size={16} /> {mission.baseXp} base XP</span>
                    <span>{mission.repeatType}</span>
                  </div>

                  {isAuthenticated && mission.appSteps?.requiredSteps?.length ? (() => {
                    const required = mission.appSteps.requiredSteps;
                    const completed = new Set(mission.completedSteps ?? []);
                    const done = verified ? required.length : required.filter((step) => completed.has(step)).length;
                    const percent = required.length ? Math.round((done / required.length) * 100) : 0;
                    const nextStep = required.find((step) => !completed.has(step));
                    return (
                      <div className={styles.stepBlock}>
                        <div className={styles.progressRow}><span>Mission progress</span><strong>{done}/{required.length}</strong></div>
                        <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${percent}%` }} /></div>
                        <div className={styles.stepList}>
                          {required.map((step) => {
                            const meta = stepMeta(step);
                            const doneStep = verified || completed.has(step);
                            return (
                              <div className={`${styles.stepItem} ${doneStep ? styles.stepDone : ""}`} key={step}>
                                {doneStep ? <CheckCircle2 size={17} /> : <CircleDot size={17} />}<span>{meta.label}</span>
                              </div>
                            );
                          })}
                        </div>
                        {!verified && nextStep && participation?.status === "active" ? (
                          <Link className={styles.continueButton} to={stepMeta(nextStep).to}>Continue: {stepMeta(nextStep).label} →</Link>
                        ) : null}
                      </div>
                    );
                  })() : isAuthenticated ? (
                    <div className={styles.progressRow}><span>Verified completions</span><strong>{mission.verifiedCompletionCount ?? 0}</strong></div>
                  ) : null}

                  <div className={styles.verificationNote}>
                    {verified ? "Mission verified. XP has been awarded." : "XP is awarded only after the mission is verified."}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.airdropNotice}>
        <ShieldCheck size={20} />
        <div>
          <strong>Participation record, not a token promise</strong>
          <p>XP, streaks, missions and achievements track verified participation. Final airdrop eligibility, allocation and distribution rules will be announced separately.</p>
        </div>
      </section>
    </div>
  );
}
