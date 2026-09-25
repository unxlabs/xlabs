import { Link } from "react-router-dom";
import LandingHeader from "./components/LandingHeader";
import styles from "./Landing.module.css";

export default function Landing() {
  return (
    <div className={styles.uxLanding}>
      <LandingHeader />

      {/* Announcement */}
      <div className={styles.uxAnnWrap}>
        <div className={styles.uxAnn}>
          <span className={styles.uxAnnDot} />
          Stake BTC, stablecoins, and more — across multiple networks.
          <span className={styles.uxAnnSep} />
          <Link className={styles.uxAnnLink} to="/app">
            Get Started →
          </Link>
        </div>
      </div>

      {/* Hero */}
      <main className={styles.uxHero}>
        <h1 className={styles.uxH1}>
          Stake Any Asset
          <br />
          Across Any Chain
        </h1>

        <p className={styles.uxP}>
          Multi-chain staking for BTC, stablecoins, and more. Connect your wallet, choose a chain, stake, and earn.
        </p>

        <div className={styles.uxCtas}>
          <Link className={styles.uxCtaPrimary} to="/app">
            Start Earning
          </Link>
          <a className={styles.uxCtaGhost} href="#how" onClick={(e) => e.preventDefault()}>
            Learn More
          </a>
        </div>

        {/* Stats card (3 columns) */}
        <section className={styles.uxStatsCard}>
          <div className={styles.uxStat}>
            <div className={styles.uxStatLabel}>Average APY</div>
            <div className={styles.uxStatValue}>—%</div>
          </div>

          <div className={styles.uxStatDivider} />

          <div className={styles.uxStat}>
            <div className={styles.uxStatLabel}>Total Value Staked</div>
            <div className={styles.uxStatValue}>$—</div>
          </div>

          <div className={styles.uxStatDivider} />

          <div className={styles.uxStat}>
            <div className={styles.uxStatLabel}>Supported Chains</div>
            <div className={styles.uxStatValue}>Multi-chain</div>
          </div>
        </section>
      </main>
    </div>
  );
}
