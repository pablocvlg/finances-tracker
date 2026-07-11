import styles from "../shared.module.css";

export default function Transactions() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Transactions</h1>
      <p className={styles.placeholder}>
        Transaction list, manual entry, recurring transactions, and category
        management will appear here.
      </p>
    </main>
  );
}
