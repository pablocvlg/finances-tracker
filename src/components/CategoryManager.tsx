"use client";

import { useRef, useState } from "react";
import type { Category, TransactionType } from "@/lib/types";
import styles from "./CategoryManager.module.css";

export default function CategoryManager({
  categories,
  onRefresh,
}: {
  categories: Category[];
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const savingRef = useRef(false);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type }),
    });
    setName("");
    onRefresh();
  }

  async function renameCategory(id: string) {
    if (savingRef.current) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    savingRef.current = true;
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    savingRef.current = false;
    setEditingId(null);
    onRefresh();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Transactions in it become uncategorized.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    onRefresh();
  }

  const expense = categories.filter((c) => c.type === "expense");
  const income = categories.filter((c) => c.type === "income");

  function renderGroup(label: string, items: Category[]) {
    return (
      <div className={styles.group}>
        <span className={styles.groupLabel}>{label}</span>
        <ul className={styles.list}>
          {items.map((cat) => (
            <li key={cat.id} className={styles.item}>
              {editingId === cat.id ? (
                <input
                  className={styles.editInput}
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => renameCategory(cat.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameCategory(cat.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={styles.name}
                  onClick={() => {
                    setEditingId(cat.id);
                    setEditingName(cat.name);
                  }}
                >
                  {cat.name}
                </button>
              )}
              <button
                type="button"
                className={styles.remove}
                aria-label={`Delete ${cat.name}`}
                onClick={() => deleteCategory(cat.id)}
              >
                ×
              </button>
            </li>
          ))}
          {items.length === 0 && <li className={styles.empty}>None yet</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Categories</h2>
      {renderGroup("Expense", expense)}
      {renderGroup("Income", income)}

      <form className={styles.form} onSubmit={addCategory}>
        <input
          className={styles.input}
          placeholder="New category"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className={styles.select}
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button type="submit" className={styles.addButton}>
          Add
        </button>
      </form>
    </div>
  );
}
