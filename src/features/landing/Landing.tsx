import { Link } from "react-router-dom";
import LandingHeader from "./components/LandingHeader";
import styles from "./Landing.module.css";

const features = [
  {
    tag: "01",
    title: "Multi-chain access",
    text: "One interface for yield opportunities across supported networks and assets.",
  },
  {
    tag: "02",
    title: "Genesis membership",
    text: "Hold Genesis Passes to unlock membership tiers, XP boosts, referral boosts and campaign access.",
  },
  {
    tag: "03",
    title: "On-chain positions",
    text: "Connect your wallet, enter the app and manage supported positions from one dashboard.",
  },
];

export default function Landing() {
  return (
    <div className={styles.uxLanding}>
      <LandingHeader />

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden />

          <div className={styles.eyebrow}>
            <span />
            UNLIMITED X LABS
          </div>

          <h1>
            One gateway to the
            <br />
            <em>on-chain economy.</em>
          </h1>

          <p className={styles.heroText}>
            Access Bitcoin and USD yield products, build your ecosystem status
            with Genesis membership, and manage your activity from one
            multi-chain platform.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.primary} to="/app">
              Launch App <span>→</span>
            </Link>

            <Link className={styles.secondary} to="/app/genesis">
              Explore Genesis Pass
            </Link>
          </div>

          <div className={styles.trustRow}>
            <div>
              <strong>BNB Chain</strong>
              <span>Genesis Pass live</span>
            </div>

            <div>
              <strong>10,000</strong>
              <span>Genesis max supply</span>
            </div>

            <div>
              <strong>1.3 USDT</strong>
              <span>Genesis price</span>
            </div>

            <div>
              <strong>Multi-chain</strong>
              <span>Ecosystem direction</span>
            </div>
          </div>
        </section>

        <section className={styles.yieldSection}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>YIELD PRODUCTS</span>
              <h2>Put your assets to work.</h2>
            </div>

            <Link to="/app/stake">View staking →</Link>
          </div>

          <div className={styles.yieldGrid}>
            <Link to="/app/stake" className={styles.yieldCard}>
              <div className={styles.assetIcon}>₿</div>

              <div className={styles.assetMeta}>
                <span>BITCOIN</span>
                <h3>Earn Bitcoin Yields through bfBTC</h3>
              </div>

              <div className={styles.apy}>
                <span>APY</span>
                <strong>6.95%</strong>
              </div>

              <div className={styles.cardAction}>STAKE →</div>
            </Link>

            <Link to="/app/stake" className={styles.yieldCard}>
              <div className={`${styles.assetIcon} ${styles.usdIcon}`}>$</div>

              <div className={styles.assetMeta}>
                <span>USD</span>
                <h3>Earn USD Yields through bfUSD</h3>
              </div>

              <div className={styles.apy}>
                <span>APY</span>
                <strong>87.85% ~ 118.99%</strong>
              </div>

              <div className={styles.cardAction}>EARN →</div>
            </Link>
          </div>
        </section>

        <section className={styles.genesisSection}>
          <div className={styles.genesisVisual}>
            <img
              src="/nft/unlimited-genesis-pass.png"
              alt="Unlimited Genesis Pass"
            />
          </div>

          <div className={styles.genesisCopy}>
            <span className={styles.kicker}>MEMBERSHIP LAYER</span>

            <h2>Genesis Pass</h2>

            <p>
              Membership that grows with your holdings. Unlock tier-based XP
              and referral boosts, badges, early access and ecosystem campaign
              privileges.
            </p>

            <div className={styles.genesisFacts}>
              <div>
                <span>Price</span>
                <strong>1.3 USDT</strong>
              </div>

              <div>
                <span>Supply</span>
                <strong>10,000</strong>
              </div>

              <div>
                <span>Network</span>
                <strong>BNB Chain</strong>
              </div>
            </div>

            <Link className={styles.primary} to="/app/genesis">
              Get Genesis Pass <span>→</span>
            </Link>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>ECOSYSTEM</span>
              <h2>Built as one connected experience.</h2>
            </div>
          </div>

          <div className={styles.featureGrid}>
            {features.map((item) => (
              <article className={styles.featureCard} key={item.tag}>
                <span>{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.stepsSection}>
          <span className={styles.kicker}>GET STARTED</span>

          <h2>From wallet to ecosystem in three steps.</h2>

          <div className={styles.steps}>
            <div>
              <b>1</b>
              <strong>Connect</strong>
              <span>Open the app and connect a supported wallet.</span>
            </div>

            <div>
              <b>2</b>
              <strong>Choose</strong>
              <span>
                Explore staking, Genesis membership and ecosystem products.
              </span>
            </div>

            <div>
              <b>3</b>
              <strong>Participate</strong>
              <span>
                Build your on-chain position and ecosystem activity.
              </span>
            </div>
          </div>

          <Link className={styles.primary} to="/app">
            Enter Unlimited X Labs <span>→</span>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <strong>Unlimited X Labs</strong>

        <span>
          Multi-chain infrastructure for the on-chain economy.
        </span>

        <Link to="/app">Launch App →</Link>
      </footer>
    </div>
  );
}