"use client";

import { useEffect, useState } from "react";
import type { Category, Frequency, RecurringTransaction } from "@/lib/types";
import type { Currency } from "@/lib/currency";
import { formatCurrency, parseAmount } from "@/lib/currency";
import styles from "./RecurringManager.module.css";
import formStyles from "./TransactionForm.module.css";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  name: "",
  category_id: "",
  amount: "",
  currency: "EUR" as Currency,
  frequency: "monthly" as Frequency,
  next_date: today(),
};

export default function RecurringManager({
  categories,
  recurring,
  onChanged,
}: {
  categories: Category[];
  recurring: RecurringTransaction[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        category_id: editing.category_id ?? "",
        amount: String(editing.amount),
        currency: editing.currency,
        frequency: editing.frequency,
        next_date: editing.next_date,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(form.amount);
    if (isNaN(amount)) return;
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      amount,
      currency: form.currency,
      frequency: form.frequency,
      next_date: form.next_date,
    };

    if (editing) {
      await fetch(`/api/recurring/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditing(null);
    setForm(emptyForm);
    onChanged();
  }

  async function toggleActive(rule: RecurringTransaction) {
    await fetch(`/api/recurring/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recurring rule? Already generated transactions stay.")) return;
    await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    onChanged();
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Recurring</h2>

      <form className={formStyles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          className={formStyles.description}
          placeholder="Name (e.g. Rent)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className={formStyles.select}
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          required
        >
          {categories.length === 0 ? (
            <option value="">No categories yet — create one first</option>
          ) : (
            <option value="">Category…</option>
          )}
          {expenseCategories.length > 0 && (
            <optgroup label="Expense">
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </optgroup>
          )}
          {incomeCategories.length > 0 && (
            <optgroup label="Income">
              {incomeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          type="text"
          inputMode="decimal"
          className={formStyles.amount}
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <select
          className={formStyles.select}
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
        >
          <option value="EUR">EUR</option>
          <option value="DKK">DKK</option>
        </select>
        <select
          className={formStyles.select}
          value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input
          type="date"
          className={formStyles.input}
          value={form.next_date}
          onChange={(e) => setForm({ ...form, next_date: e.target.value })}
          required
        />
        <button type="submit" className={formStyles.submit}>
          {editing ? "Save" : "Add"}
        </button>
        {editing && (
          <button type="button" className={formStyles.cancel} onClick={() => setEditing(null)}>
            Cancel
          </button>
        )}
      </form>

      {recurring.length === 0 ? (
        <p className={styles.empty}>No recurring rules yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th className={styles.amount}>Amount</th>
              <th>Frequency</th>
              <th>Next</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recurring.map((rule) => (
              <tr key={rule.id} className={rule.active ? "" : styles.inactive}>
                <td>{rule.name}</td>
                <td>{rule.categories?.name ?? "No category"}</td>
                <td className={styles.amount}>{formatCurrency(rule.amount, rule.currency)}</td>
                <td>{rule.frequency}</td>
                <td>{rule.next_date}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={rule.active}
                    onChange={() => toggleActive(rule)}
                    aria-label={`Toggle ${rule.name}`}
                  />
                </td>
                <td className={styles.actions}>
                  <button type="button" onClick={() => setEditing(rule)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(rule.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
