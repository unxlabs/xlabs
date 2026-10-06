import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUp, Crown, LoaderCircle, RefreshCw, Target, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/shared/auth/AuthProvider";
import { getSeasonLeaderboard, type LeaderboardEntry, type SeasonLeaderboardResponse } from "@/shared/api/leaderboard";
import styles from "./Leaderboard.module.css";

function shortAddress(address: string | null) {
  if (!address) return null;
  return address.length < 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function displayName(entry: LeaderboardEntry) {
  return entry.username || shortAddress(entry.walletAddress) || `Member #${entry.rank}`;
}

function Identity({ entry, compact = false }: { entry: LeaderboardEntry; compact?: boolean }) {
  const wallet = shortAddress(entry.walletAddress);
  const hasUsername = Boolean(entry.username);

  return (
    <div className={compact ? styles.topIdentity : styles.identityText}>
      <strong>{displayName(entry)}</strong>
      {hasUsername && wallet ? <small>{wallet}</small> : null}
    </div>
  );
}

function RankRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className={`${styles.rankRow} ${entry.isMe ? styles.meRow : ""}`}>
      <div className={styles.rankNumber}>#{entry.rank}</div>
      <div className={styles.identity}>
        <Identity entry={entry} />
        {entry.isMe ? <span>YOU</span> : null}
      </div>
      <div className={styles.xp}>{entry.seasonXp.toLocaleString()} <span>XP</span></div>
    </div>
  );
}

export default function Leaderboard() {
  const { isAuthenticated, isAuthenticating, isRestoring, authenticate } = useAuth();
  const [data, setData] = useState<SeasonLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try { setData(await getSeasonLeaderboard()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load leaderboard."); }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { void load(); }, [load]);

  const topThree = useMemo(() => data?.entries.slice(0, 3) ?? [], [data]);
  const remaining = useMemo(() => data?.entries.slice(3) ?? [], [data]);
  const around = useMemo(() => {
    if (!data?.me) return [];
    if (data.aroundMe.length) return data.aroundMe;
    return data.entries.filter((entry) => Math.abs(entry.rank - data.me!.rank) <= 2);
  }, [data]);

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <section className={styles.guestHero}>
          <span className={styles.eyebrow}>SEASON COMPETITION</span>
          <h1>Leaderboard</h1>
          <p>Sign in to see your live Season rank, nearby participants and the verified XP separating you from the next position.</p>
          <button className={styles.primaryButton} type="button" onClick={() => void authenticate()} disabled={isAuthenticating || isRestoring}>
            {isAuthenticating || isRestoring ? <LoaderCircle size={18} className={styles.spin} /> : <Trophy size={18} />}
            {isRestoring ? "Restoring session…" : isAuthenticating ? "Signing in…" : "Sign in with wallet"}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>SEASON 1 · LIVE COMPETITION</span>
          <h1>Leaderboard</h1>
          <p>Climb through verified participation. Rank is driven by Season XP — not by deposit size or capital.</p>
        </div>
        <button className={styles.refreshButton} type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={17} className={loading ? styles.spin : undefined} /> Refresh
        </button>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading && !data ? (
        <div className={styles.loading}><LoaderCircle size={22} className={styles.spin} /> Loading live competition…</div>
      ) : data ? (
        <>
          <section className={styles.meCard}>
            <div className={styles.meRank}>
              <span>YOUR LIVE RANK</span>
              <strong>{data.me ? `#${data.me.rank}` : "—"}</strong>
              <small>{data.totalParticipants.toLocaleString()} active participant{data.totalParticipants === 1 ? "" : "s"}</small>
            </div>
            <div className={styles.meXp}>
              <span>SEASON XP</span>
              <strong>{(data.me?.seasonXp ?? 0).toLocaleString()}</strong>
            </div>
            <div className={styles.nextRank}>
              <div className={styles.nextRankIcon}><ArrowUp size={19} /></div>
              <div>
                <span>NEXT POSITION</span>
                {data.me?.rank === 1 ? (
                  <><strong>You are leading</strong><p>Keep building verified activity to defend your position.</p></>
                ) : data.me?.xpToNextRank != null ? (
                  <><strong>{data.me.xpToNextRank.toLocaleString()} XP to challenge #{Math.max(1, data.me.rank - 1)}</strong><p>The gap updates as participants earn verified Season XP.</p></>
                ) : (
                  <><strong>Keep progressing</strong><p>Your next-rank gap will appear as the competition data updates.</p></>
                )}
              </div>
            </div>
          </section>

          {topThree.length ? (
            <section className={styles.section}>
              <div className={styles.sectionHead}><div><span className={styles.eyebrowDark}>FRONT RUNNERS</span><h2>Top participants</h2></div><Crown size={22} /></div>
              <div className={styles.topThree}>
                {topThree.map((entry) => (
                  <article className={`${styles.topCard} ${entry.isMe ? styles.meTopCard : ""}`} key={entry.userId}>
                    <div className={styles.topRank}>#{entry.rank}</div>
                    <Identity entry={entry} compact />
                    <span>{entry.seasonXp.toLocaleString()} XP</span>
                    {entry.isMe ? <small>YOU</small> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {around.length ? (
            <section className={styles.section}>
              <div className={styles.sectionHead}><div><span className={styles.eyebrowDark}>YOUR NEIGHBORHOOD</span><h2>Around you</h2></div><Target size={22} /></div>
              <div className={styles.rankList}>{around.map((entry) => <RankRow entry={entry} key={`around-${entry.userId}`} />)}</div>
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrowDark}>SEASON STANDINGS</span><h2>Top 100</h2></div><Users size={22} /></div>
            {remaining.length || topThree.length ? (
              <div className={styles.rankList}>{remaining.map((entry) => <RankRow entry={entry} key={entry.userId} />)}</div>
            ) : <div className={styles.empty}>No ranked participants yet.</div>}
          </section>

          <section className={styles.note}>
            <Trophy size={19} />
            <div><strong>Competition reflects participation, not a token allocation.</strong><p>Leaderboard rank is based on current Season XP. Final airdrop eligibility and allocation rules remain separate.</p></div>
            <Link to="/app/airdrop">Build participation</Link>
          </section>
        </>
      ) : null}
    </div>
  );
}
