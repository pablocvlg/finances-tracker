import styles from "./shared.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Net worth</h1>
      <p className={styles.placeholder}>
        Dashboard totals, net worth evolution, and category breakdowns will
        appear here once assets and transactions are wired up.
      </p>
    </main>
  );
}
