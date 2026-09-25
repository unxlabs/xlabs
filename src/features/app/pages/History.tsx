import styles from "./History.module.css";

export default function History() {
  return (
    <div className={styles.uxPage}>
      <h2 className={styles.uxSectionTitle}>History</h2>
      <p className={styles.uxSectionSub}>Transactions and staking history will appear here.</p>
      <div className={styles.uxCardSoft}>Coming soon…</div>
    </div>
  );
}