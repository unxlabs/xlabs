import styles from "./Learn.module.css";

export default function Learn() {
  return (
    <div className={styles.uxPage}>
      <h2 className={styles.uxSectionTitle}>Learn</h2>
      <p className={styles.uxSectionSub}>Guides and explanations for users.</p>
      <div className={styles.uxCardSoft}>Coming soon…</div>
    </div>
  );
}