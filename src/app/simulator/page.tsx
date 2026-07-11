import styles from "../shared.module.css";

export default function Simulator() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Simulator</h1>
      <p className={styles.placeholder}>
        Goal-based required savings and trend-based projection modes will
        appear here.
      </p>
    </main>
  );
}
