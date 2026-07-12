"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CategoryManager from "@/components/CategoryManager";
import RecurringManager from "@/components/RecurringManager";
import TransactionFilters, { type Filters } from "@/components/TransactionFilters";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import type { Asset, Category, RecurringTransaction, Transaction } from "@/lib/types";
import styles from "../shared.module.css";
import pageStyles from "./page.module.css";

const emptyFilters: Filters = { type: "", category_id: "", from: "", to: "" };

export default function Transactions() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const processedRef = useRef(false);

  const loadCategories = useCallback(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const loadAssets = useCallback(() => {
    fetch("/api/assets")
      .then((res) => res.json())
      .then(setAssets);
  }, []);

  const loadRecurring = useCallback(() => {
    fetch("/api/recurring")
      .then((res) => res.json())
      .then(setRecurring);
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
  useEffect(loadAssets, [loadAssets]);
  useEffect(loadTransactions, [loadTransactions]);
  useEffect(loadRecurring, [loadRecurring]);

  // Materialize due recurring rules once per visit, then refresh both lists.
  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    fetch("/api/recurring/process", { method: "POST" }).then(() => {
      loadTransactions();
      loadRecurring();
      loadAssets();
    });
  }, [loadTransactions, loadRecurring, loadAssets]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction? Its effect on the linked asset is undone.")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    loadTransactions();
    loadAssets();
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Transactions</h1>

      <div className={pageStyles.layout}>
        <div>
          <TransactionForm
            categories={categories}
            assets={assets}
            editing={editing}
            onSaved={() => {
              setEditing(null);
              loadTransactions();
              loadAssets();
            }}
            onCancelEdit={() => setEditing(null)}
          />

          <TransactionFilters categories={categories} filters={filters} onChange={setFilters} />

          <TransactionList
            transactions={transactions}
            onEdit={setEditing}
            onDelete={handleDelete}
          />

          <RecurringManager
            categories={categories}
            assets={assets}
            recurring={recurring}
            onChanged={() => {
              loadRecurring();
              loadTransactions();
              loadAssets();
            }}
          />
        </div>

        <aside>
          <CategoryManager categories={categories} onRefresh={loadCategories} />
        </aside>
      </div>
    </main>
  );
}
