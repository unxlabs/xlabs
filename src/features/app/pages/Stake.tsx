import styles from "./Stake.module.css";

export default function Stake() {
  return (
    <div className={styles.uxPage}>
      <h2 className={styles.uxSectionTitle}>Stake</h2>
      <p className={styles.uxSectionSub}>
        Choose a chain, choose an asset, and stake. (We’ll connect contracts later.)
      </p>

      <div className={styles.uxPools}>
        <div className={styles.uxPool}>
          <div className={styles.uxPoolTitle}>BTC Pool</div>
          <div className={styles.uxPoolMeta}>APY: —% • Multi-chain</div>
          <button className={styles.uxPrimaryBtn} type="button">
            Stake
          </button>
        </div>

        <div className={styles.uxPool}>
          <div className={styles.uxPoolTitle}>Stable Pool</div>
          <div className={styles.uxPoolMeta}>APY: —% • Multi-chain</div>
          <button className={styles.uxPrimaryBtn} type="button">
            Stake
          </button>
        </div>
      </div>
    </div>
  );
}