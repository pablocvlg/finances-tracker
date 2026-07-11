"use client";

import { useCallback, useEffect, useState } from "react";
import CategoryManager from "@/components/CategoryManager";
import TransactionFilters, { type Filters } from "@/components/TransactionFilters";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import type { Category, Transaction } from "@/lib/types";
import styles from "../shared.module.css";
import pageStyles from "./page.module.css";

const emptyFilters: Filters = { type: "", category_id: "", from: "", to: "" };

export default function Transactions() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const loadCategories = useCallback(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const loadTransactions = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.category_id) params.set("category_id", filters.category_id);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    fetch(`/api/transactions?${params.toString()}`)
      .then((res) => res.json())
      .then(setTransactions);
  }, [filters]);

  useEffect(loadCategories, [loadCategories]);
  useEffect(loadTransactions, [loadTransactions]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    loadTransactions();
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Transactions</h1>

      <div className={pageStyles.layout}>
        <div>
          <TransactionForm
            categories={categories}
            editing={editing}
            onSaved={() => {
              setEditing(null);
              loadTransactions();
            }}
            onCancelEdit={() => setEditing(null)}
          />

          <TransactionFilters categories={categories} filters={filters} onChange={setFilters} />

          <TransactionList
            transactions={transactions}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </div>

        <aside>
          <CategoryManager categories={categories} onRefresh={loadCategories} />
        </aside>
      </div>
    </main>
  );
}
