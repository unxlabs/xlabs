import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";
import styles from "./Portfolio.module.css";

function HeroConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
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
          <div
            className={styles.uxLiteWalletPill}
            title={account.address}
          >
            <span className={styles.uxLiteWalletAddr}>
              {account.displayName}
            </span>

            {account.displayBalance ? (
              <span className={styles.uxLiteWalletBal}>
                {account.displayBalance}
              </span>
            ) : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function Portfolio() {
  return (
    <div className={`${styles.uxPage} ${styles.uxPageLite}`}>
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
              Earn Where
            </h2>

            <h2
              className={`${styles.uxHeroTitle} ${styles.uxHeroTitleLite}`}
            >
              You Store
            </h2>

            <p
              className={`${styles.uxHeroSub} ${styles.uxHeroSubLite}`}
            >
              Stake assets across
            </p>

            <p
              className={`${styles.uxHeroSub} ${styles.uxHeroSubLite}`}
            >
              chains and earn yield.
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

      {/* Desktop tabs row */}
      <div
        className={`${styles.uxTabsRow} ${styles.uxTabsRowLite}`}
      >
        <div className={styles.uxTabs}>
          <button
            className={`${styles.uxTab} ${styles.isActive}`}
            type="button"
          >
            Portfolio
          </button>

          <button
            className={styles.uxTab}
            type="button"
          >
            Withdraw (0)
          </button>

          <button
            className={styles.uxTab}
            type="button"
          >
            History
          </button>
        </div>

        <div
          className={`${styles.uxNetPill} ${styles.uxNetPillLite}`}
        >
          Ethereum ▾
        </div>
      </div>

      {/* Empty state */}
      <div
        className={`${styles.uxEmpty} ${styles.uxEmptyLite}`}
      >
        <div className={styles.uxEmptyIcon}>◎</div>

        <div className={styles.uxEmptyText}>
          Please connect your wallet to continue
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div
        className={styles.uxBottomBar}
        aria-hidden
      >
        <button
          className={`${styles.uxBottomTab} ${styles.isActive}`}
          type="button"
        >
          Portfolio
        </button>

        <button
          className={styles.uxBottomTab}
          type="button"
        >
          Withdraw (0)
        </button>

        <button
          className={styles.uxBottomTab}
          type="button"
        >
          History
        </button>

        <div className={styles.uxBottomNet}>
          Ethereum ▾
        </div>
      </div>
    </div>
  );
}