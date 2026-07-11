"use client";

import type { Category, TransactionType } from "@/lib/types";
import styles from "./TransactionFilters.module.css";

export type Filters = {
  type: TransactionType | "";
  category_id: string;
  from: string;
  to: string;
};

export default function TransactionFilters({
  categories,
  filters,
  onChange,
}: {
  categories: Category[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <div className={styles.wrapper}>
      <select
        className={styles.select}
        value={filters.type}
        onChange={(e) =>
          onChange({ ...filters, type: e.target.value as TransactionType | "", category_id: "" })
        }
      >
        <option value="">All types</option>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <select
        className={styles.select}
        value={filters.category_id}
        onChange={(e) => onChange({ ...filters, category_id: e.target.value })}
      >
        <option value="">All categories</option>
        {categories
          .filter((c) => !filters.type || c.type === filters.type)
          .map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
      </select>
      <input
        type="date"
        className={styles.date}
        value={filters.from}
        onChange={(e) => onChange({ ...filters, from: e.target.value })}
      />
      <span className={styles.separator}>to</span>
      <input
        type="date"
        className={styles.date}
        value={filters.to}
        onChange={(e) => onChange({ ...filters, to: e.target.value })}
      />
      {(filters.type || filters.category_id || filters.from || filters.to) && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange({ type: "", category_id: "", from: "", to: "" })}
        >
          Clear
        </button>
      )}
    </div>
  );
}
