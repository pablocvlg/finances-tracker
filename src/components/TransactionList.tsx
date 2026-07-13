"use client";

import type { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import styles from "./TransactionList.module.css";

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  if (transactions.length === 0) {
    return <p className={styles.empty}>No transactions match these filters.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Category</th>
          <th>Asset</th>
          <th className={styles.amountHeader}>Amount</th>
          <th>Description</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id}>
            <td>{tx.date}</td>
            <td
              className={
                tx.type === "expense"
                  ? styles.expense
                  : tx.type === "income"
                    ? styles.income
                    : styles.exchange
              }
            >
              {tx.type}
            </td>
            <td>{tx.type === "exchange" ? "—" : (tx.categories?.name ?? "Uncategorized")}</td>
            <td>
              {tx.type === "exchange"
                ? `${tx.assets?.name ?? "—"} → ${tx.to_assets?.name ?? "—"}`
                : (tx.assets?.name ?? "—")}
            </td>
            <td className={styles.amountHeader}>
              {formatCurrency(tx.amount, tx.currency)}
              {tx.fee > 0 && (
                <span className={styles.fee}> +{formatCurrency(tx.fee, tx.currency)} fee</span>
              )}
            </td>
            <td className={styles.description}>{tx.description}</td>
            <td className={styles.actions}>
              <button type="button" onClick={() => onEdit(tx)}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(tx.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
