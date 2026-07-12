"use client";

import { useEffect, useState } from "react";
import type { Category, Transaction, TransactionType } from "@/lib/types";
import { parseAmount, type Currency } from "@/lib/currency";
import styles from "./TransactionForm.module.css";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  date: today(),
  type: "expense" as TransactionType,
  category_id: "",
  amount: "",
  currency: "EUR" as Currency,
  description: "",
};

export default function TransactionForm({
  categories,
  editing,
  onSaved,
  onCancelEdit,
}: {
  categories: Category[];
  editing: Transaction | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editing) {
      setForm({
        date: editing.date,
        type: editing.type,
        category_id: editing.category_id ?? "",
        amount: String(editing.amount),
        currency: editing.currency,
        description: editing.description ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  const availableCategories = categories.filter((c) => c.type === form.type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(form.amount);
    if (isNaN(amount)) return;
    const payload = {
      date: form.date,
      type: form.type,
      category_id: form.category_id || null,
      amount,
      currency: form.currency,
      description: form.description || null,
    };

    if (editing) {
      await fetch(`/api/transactions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm(emptyForm);
    onSaved();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="date"
        className={styles.input}
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />
      <select
        className={styles.select}
        value={form.type}
        onChange={(e) =>
          setForm({ ...form, type: e.target.value as TransactionType, category_id: "" })
        }
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <select
        className={styles.select}
        value={form.category_id}
        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
      >
        <option value="">Uncategorized</option>
        {availableCategories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        inputMode="decimal"
        className={styles.amount}
        placeholder="Amount"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        required
      />
      <select
        className={styles.select}
        value={form.currency}
        onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
      >
        <option value="EUR">EUR</option>
        <option value="DKK">DKK</option>
      </select>
      <input
        type="text"
        className={styles.description}
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <button type="submit" className={styles.submit}>
        {editing ? "Save" : "Add"}
      </button>
      {editing && (
        <button type="button" className={styles.cancel} onClick={onCancelEdit}>
          Cancel
        </button>
      )}
    </form>
  );
}
