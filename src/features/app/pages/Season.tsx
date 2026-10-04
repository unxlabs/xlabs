import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleDot, LoaderCircle, RefreshCw, Sparkles, Trophy, Wallet } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

import { useAuth } from "@/shared/auth/AuthProvider";
import { getMyProgression, type ProgressionSnapshot } from "@/shared/api/progression";
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
  return STEP_META[stepKey] ?? { label: stepKey, to: "/app/season" };
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
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        const [result, progressionResult] = await Promise.all([
          getMyMissions(),
          getMyProgression(),
        ]);
        setSeason(result.season);
        setParticipation(result.participation);
        setMissions(result.missions);
        setProgression(progressionResult.progression);
      } else {
        const [seasonResult, missionResult] = await Promise.all([
          getCurrentSeason(),
          getPublicMissions(),
        ]);
        setSeason(seasonResult.season);
        setParticipation(null);
        setMissions(missionResult.missions);
        setProgression(null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the season.",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const completedCount = useMemo(
    () =>
      missions.filter(
        (mission) => (mission.verifiedCompletionCount ?? 0) > 0,
      ).length,
    [missions],
  );

  const handleJoin = async () => {
    if (!isAuthenticated) return;

    setJoining(true);
    setError(null);

    try {
      const result = await joinCurrentSeason();
      setSeason(result.season);
      setParticipation(result.participation);

      const missionResult = await getMyMissions();
      setSeason(missionResult.season);
      setParticipation(missionResult.participation);
      setMissions(missionResult.missions);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Unable to join the season.",
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>CURRENT SEASON</div>
          <h1>{season?.name ?? "Season"}</h1>
          <p>
            {season?.description ??
              "Complete verified activity, build XP and progress through the season."}
          </p>
        </div>

        <div className={styles.heroActions}>
          {participation ? (
            <div className={styles.joinedPill}>
              <CheckCircle2 size={18} /> Joined
            </div>
          ) : isAuthenticated ? (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => void handleJoin()}
              disabled={joining || !season}
            >
              {joining ? (
                <LoaderCircle size={18} className={styles.spin} />
              ) : (
                <CircleDot size={18} />
              )}
              {joining ? "Joining…" : "Join Season"}
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
                    {busy ? (
                      <LoaderCircle size={18} className={styles.spin} />
                    ) : connected ? (
                      <CircleDot size={18} />
                    ) : (
                      <Wallet size={18} />
                    )}
                    {isRestoring
                      ? "Checking session…"
                      : isAuthenticating
                        ? "Signing in…"
                        : connected
                          ? "Sign in"
                          : "Connect Wallet"}
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
            aria-label="Refresh season"
          >
            <RefreshCw
              size={18}
              className={loading ? styles.spin : undefined}
            />
          </button>
        </div>
      </section>

      {error || authError ? (
        <div className={styles.error}>{error ?? authError}</div>
      ) : null}

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>Status</span>
          <strong>
            {participation?.status ??
              (isAuthenticated ? "Ready to join" : "Sign in")}
          </strong>
        </div>
        <div className={styles.statCard}>
          <span>Season XP</span>
          <strong>{participation?.seasonXp ?? 0}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Verified missions</span>
          <strong>
            {completedCount}/{missions.length}
          </strong>
        </div>
        <div className={styles.statCard}>
          <span>Season ends</span>
          <strong>{formatDate(season?.endsAt ?? null)}</strong>
        </div>
      </section>

      {isAuthenticated && progression?.currentLevel ? (
        <section className={styles.progressionCard}>
          <div className={styles.progressionMain}>
            <div className={styles.progressionHeading}>
              <div>
                <div className={styles.eyebrow}>YOUR PROGRESSION</div>
                <div className={styles.levelLine}>
                  <span className={styles.levelIcon}><Sparkles size={18} /></span>
                  <h2>{progression.currentLevel.name}</h2>
                </div>
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
                  <div
                    className={styles.levelProgressFill}
                    style={{ width: `${progression.progress.progressPercent}%` }}
                  />
                </div>
                <div className={styles.levelProgressFoot}>
                  <span>{progression.lifetimeXp.toLocaleString()} XP</span>
                  <span>{progression.progress.xpToNextLevel.toLocaleString()} XP to {progression.nextLevel.name}</span>
                  <span>{progression.nextLevel.minLifetimeXp.toLocaleString()} XP</span>
                </div>
              </>
            ) : (
              <div className={styles.maxLevel}>
                <Trophy size={18} /> You reached the highest progression level.
              </div>
            )}
          </div>

          <div className={styles.nextMovePreview}>
            <div className={styles.nextMoveIcon}><ArrowUpRight size={20} /></div>
            <div>
              <span>COMING NEXT</span>
              <strong>Your Next Move</strong>
              <p>One clear action, selected from your verified activity and progress.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.eyebrow}>MISSIONS</div>
            <h2>Your next moves</h2>
          </div>
          <div className={styles.count}>{missions.length} active</div>
        </div>

        {loading ? (
          <div className={styles.empty}>
            <LoaderCircle size={22} className={styles.spin} /> Loading missions…
          </div>
        ) : missions.length === 0 ? (
          <div className={styles.empty}>
            No active missions are available right now.
          </div>
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
                  <p>{mission.description || "Complete this mission to build your season progress."}</p>

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
                          {required.map((step) => { const meta=stepMeta(step); const doneStep=verified || completed.has(step); return (
                            <div className={`${styles.stepItem} ${doneStep ? styles.stepDone : ""}`} key={step}>
                              {doneStep ? <CheckCircle2 size={17} /> : <CircleDot size={17} />}<span>{meta.label}</span>
                            </div>
                          ); })}
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
                    {verified ? "Mission verified. XP has been awarded." : "XP is awarded after the mission is verified."}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
