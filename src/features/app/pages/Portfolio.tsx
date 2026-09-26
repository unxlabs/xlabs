import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";
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
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <div
              className={`${styles.uxEmpty} ${styles.uxEmptyLite}`}
            >
              <div className={styles.uxEmptyIcon}>◎</div>

              <div className={styles.uxEmptyText}>
                Loading wallet...
              </div>
            </div>
          );
        }

        if (!connected) {
          return (
            <div
              className={`${styles.uxEmpty} ${styles.uxEmptyLite}`}
            >
              <div className={styles.uxEmptyIcon}>◎</div>

              <div className={styles.uxEmptyText}>
                Connect your wallet to view your portfolio
              </div>
            </div>
          );
        }

        return (
          <div
            className={`${styles.uxEmpty} ${styles.uxEmptyLite}`}
          >
            <div className={styles.uxEmptyIcon}>✓</div>

            <div className={styles.uxEmptyText}>
              Wallet connected. Choose Earn, Stake, Genesis Pass,
              or History to manage your activity.
            </div>
          </div>
        );
      }}
    </ConnectButton.Custom>
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