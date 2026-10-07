import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

import { getMyNextMove, type NextMove } from "@/shared/api/nextMove";
import { getMyProgression, type ProgressionSnapshot } from "@/shared/api/progression";
import { getMyRewards, type RewardProfile } from "@/shared/api/rewards";
import { useAuth } from "@/shared/auth/AuthProvider";
import styles from "./Portfolio.module.css";

function HeroConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openAccountModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <button
              className={styles.uxLiteBtn}
              type="button"
              disabled
            >
              Connect Wallet
            </button>
          );
        }

        if (!connected) {
          return (
            <button
              className={styles.uxLiteBtn}
              type="button"
              onClick={openConnectModal}
            >
              Connect Wallet
            </button>
          );
        }

        return (
          <button
            className={styles.uxLiteWalletPill}
            type="button"
            onClick={openAccountModal}
            title="Open wallet"
          >
            <span className={styles.uxLiteWalletAddr}>
              {account.displayName}
            </span>

            {account.displayBalance ? (
              <span className={styles.uxLiteWalletBal}>
                {account.displayBalance}
              </span>
            ) : null}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

function PortfolioStatus() {
  const { isAuthenticated, authenticate, isAuthenticating, isRestoring } = useAuth();
  const [progression, setProgression] = useState<ProgressionSnapshot | null>(null);
  const [rewards, setRewards] = useState<RewardProfile | null>(null);
  const [nextMove, setNextMove] = useState<NextMove | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setProgression(null);
      setRewards(null);
      setNextMove(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void Promise.allSettled([
      getMyProgression(),
      getMyRewards(),
      getMyNextMove(),
    ]).then(([progressionResult, rewardsResult, nextMoveResult]) => {
      if (cancelled) return;
      if (progressionResult.status === "fulfilled") setProgression(progressionResult.value.progression);
      if (rewardsResult.status === "fulfilled") setRewards(rewardsResult.value.rewards);
      if (nextMoveResult.status === "fulfilled") setNextMove(nextMoveResult.value.nextMove);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className={styles.progressGate}>
        <div>
          <span>YOUR PROGRESS</span>
          <strong>Turn activity into a track record.</strong>
          <p>Sign in to see XP, level, rewards and your next best move.</p>
        </div>
        <button type="button" onClick={() => void authenticate()} disabled={isAuthenticating || isRestoring}>
          {isAuthenticating ? "Check your wallet…" : isRestoring ? "Restoring…" : "Sign in"}
        </button>
      </div>
    );
  }

  const claimable = rewards?.summary.claimable ?? 0;
  const delivered = rewards?.summary.claimed ?? 0;

  return (
    <section className={styles.progressPanel}>
      <div className={styles.progressHeading}>
        <div>
          <span>YOUR PROGRESS</span>
          <h3>{loading ? "Loading your profile…" : progression?.currentLevel?.name || "Build your first level"}</h3>
        </div>
        <Link to="/app/season">View progression →</Link>
      </div>

      <div className={styles.progressMetrics}>
        <div><span>Lifetime XP</span><strong>{progression?.lifetimeXp ?? 0}</strong></div>
        <div><span>To next level</span><strong>{progression?.progress.xpToNextLevel ?? 0}</strong></div>
        <div><span>Rewards ready</span><strong>{claimable}</strong></div>
        <div><span>Delivered</span><strong>{delivered}</strong></div>
      </div>

      {nextMove ? (
        <div className={styles.nextMove}>
          <div>
            <span>NEXT BEST MOVE</span>
            <strong>{nextMove.title}</strong>
            <p>{nextMove.description}</p>
          </div>
          <Link to={nextMove.href}>{nextMove.ctaLabel} →</Link>
        </div>
      ) : null}
    </section>
  );
}

export default function Portfolio() {
  return (
    <div
      className={`${styles.uxPage} ${styles.uxPageLite}`}
    >
      {/* HERO */}

      <div
        className={`${styles.uxHeroCard} ${styles.uxHeroCardLite}`}
      >
        <div
          className={`${styles.uxHeroGrid} ${styles.uxHeroGridBitfi}`}
        >
          <div className={styles.uxHeroCopy}>
            <h2
              className={`${styles.uxHeroTitle} ${styles.uxHeroTitleLite}`}
            >
              Your On-Chain
            </h2>

            <h2
              className={`${styles.uxHeroTitle} ${styles.uxHeroTitleLite}`}
            >
              Portfolio
            </h2>

            <p
              className={`${styles.uxHeroSub} ${styles.uxHeroSubLite}`}
            >
              Earn, stake and manage
            </p>

            <p
              className={`${styles.uxHeroSub} ${styles.uxHeroSubLite}`}
            >
              your activity on BNB Chain.
            </p>

            <div className={styles.uxHeroActions}>
              <HeroConnectButton />
            </div>
          </div>

          <div
            className={`${styles.uxHeroArt} ${styles.uxHeroArtBitfi}`}
            aria-hidden
          >
            <div
              className={`${styles.uxHeroLogo} ${styles.uxHeroLogoBTC}`}
            >
              ₿
            </div>
          </div>
        </div>
      </div>

      {/* EARN PRODUCTS */}

      <div
        className={`${styles.uxTiles} ${styles.uxTilesLite}`}
      >
        <Link
          className={`${styles.uxTile} ${styles.uxTileLite} ${styles.uxTileGreen}`}
          to="/app/earn?asset=btc"
        >
          <div
            className={`${styles.uxTileTop} ${styles.uxTileTopLite}`}
          >
            Earn Bitcoin Yields through bfBTC
          </div>

          <div
            className={`${styles.uxTileBig} ${styles.uxTileBigLite}`}
          >
            APY: 6.95%
          </div>

          <div
            className={`${styles.uxTileCta} ${styles.uxTileCtaLite}`}
          >
            EARN →
          </div>
        </Link>

        <Link
          className={`${styles.uxTile} ${styles.uxTileLite} ${styles.uxTileAqua}`}
          to="/app/earn?asset=usd"
        >
          <div
            className={`${styles.uxTileTop} ${styles.uxTileTopLite}`}
          >
            Earn USD Yields through bfUSD
          </div>

          <div
            className={`${styles.uxTileBig} ${styles.uxTileBigLite}`}
          >
            APY: 87.85% ~ 118.99%
          </div>

          <div
            className={`${styles.uxTileCta} ${styles.uxTileCtaLite}`}
          >
            EARN →
          </div>
        </Link>
      </div>

      {/* DESKTOP NAVIGATION */}

      <div
        className={`${styles.uxTabsRow} ${styles.uxTabsRowLite}`}
      >
        <div className={styles.uxTabs}>
          <Link
            className={`${styles.uxTab} ${styles.isActive}`}
            to="/app"
          >
            Portfolio
          </Link>

          <Link
            className={styles.uxTab}
            to="/app/earn?asset=btc"
          >
            Earn
          </Link>

          <Link
            className={styles.uxTab}
            to="/app/stake"
          >
            Stake
          </Link>

          <Link
            className={styles.uxTab}
            to="/app/history"
          >
            History
          </Link>
        </div>

        <div
          className={`${styles.uxNetPill} ${styles.uxNetPillLite}`}
          title="Current network"
        >
          BNB Chain
        </div>
      </div>

      {/* PORTFOLIO STATUS */}

      <PortfolioStatus />

      {/* MOBILE BOTTOM NAVIGATION */}

      <div className={styles.uxBottomBar}>
        <Link
          className={`${styles.uxBottomTab} ${styles.isActive}`}
          to="/app"
        >
          Portfolio
        </Link>

        <Link
          className={styles.uxBottomTab}
          to="/app/earn?asset=btc"
        >
          Earn
        </Link>

        <Link
          className={styles.uxBottomTab}
          to="/app/stake"
        >
          Stake
        </Link>

        <Link
          className={styles.uxBottomTab}
          to="/app/history"
        >
          History
        </Link>

        <div
          className={styles.uxBottomNet}
          title="Current network"
        >
          BNB Chain
        </div>
      </div>
    </div>
  );
}