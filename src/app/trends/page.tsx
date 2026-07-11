import styles from "../shared.module.css";

export default function Trends() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Trends</h1>
      <p className={styles.placeholder}>
        Net worth evolution, category spend over time, and monthly
        income-vs-expenses comparisons will appear here.
      </p>
    </main>
  );
}
