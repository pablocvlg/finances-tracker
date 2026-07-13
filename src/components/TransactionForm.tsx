"use client";

import { useEffect, useState } from "react";
import type { Asset, Category, Transaction, TransactionKind } from "@/lib/types";
import { parseAmount, type Currency } from "@/lib/currency";
import styles from "./TransactionForm.module.css";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  date: today(),
  type: "expense" as TransactionKind,
  category_id: "",
  asset_id: "",
  to_asset_id: "",
  amount: "",
  received_amount: "",
  fee: "",
  currency: "EUR" as Currency,
  description: "",
};

export default function TransactionForm({
  categories,
  assets,
  editing,
  onSaved,
  onCancelEdit,
}: {
  categories: Category[];
  assets: Asset[];
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
        asset_id: editing.asset_id ?? "",
        to_asset_id: editing.to_asset_id ?? "",
        amount: String(editing.amount),
        received_amount: editing.received_amount != null ? String(editing.received_amount) : "",
        fee: editing.fee > 0 ? String(editing.fee) : "",
        currency: editing.currency,
        description: editing.description ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  const isExchange = form.type === "exchange";
  const availableCategories = categories.filter((c) => c.type === form.type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(form.amount);
    if (isNaN(amount)) return;
    const fee = parseAmount(form.fee);
    const received = parseAmount(form.received_amount);

    const payload = {
      date: form.date,
      type: form.type,
      category_id: isExchange ? null : form.category_id || null,
      asset_id: form.asset_id || null,
      to_asset_id: isExchange ? form.to_asset_id || null : null,
      amount,
      received_amount: isExchange && !isNaN(received) ? received : null,
      fee: !isNaN(fee) && fee > 0 ? fee : 0,
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

  const toAssetCurrency = assets.find((a) => a.id === form.to_asset_id)?.currency;

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
          setForm({ ...form, type: e.target.value as TransactionKind, category_id: "" })
        }
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
        <option value="exchange">Exchange</option>
      </select>
      {!isExchange && (
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
      )}
      <select
        className={styles.select}
        value={form.asset_id}
        onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
        required
        aria-label={isExchange ? "From asset" : "Asset"}
      >
        <option value="">
          {assets.length === 0
            ? "No assets yet — add one on Home"
            : isExchange
              ? "From asset…"
              : "Asset…"}
        </option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.name}
          </option>
        ))}
      </select>
      {isExchange && (
        <select
          className={styles.select}
          value={form.to_asset_id}
          onChange={(e) => setForm({ ...form, to_asset_id: e.target.value })}
          required
          aria-label="To asset"
        >
          <option value="">To asset…</option>
          {assets
            .filter((asset) => asset.id !== form.asset_id)
            .map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
        </select>
      )}
      <input
        type="text"
        inputMode="decimal"
        className={styles.amount}
        placeholder={isExchange ? "Sent" : "Amount"}
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
      {isExchange && (
        <input
          type="text"
          inputMode="decimal"
          className={styles.amount}
          placeholder={`Received${toAssetCurrency ? ` (${toAssetCurrency})` : ""}`}
          title="Amount credited to the target asset, in its currency. Blank converts at the fixed rate."
          value={form.received_amount}
          onChange={(e) => setForm({ ...form, received_amount: e.target.value })}
        />
      )}
      <input
        type="text"
        inputMode="decimal"
        className={styles.fee}
        placeholder="Fee"
        title="Optional fee, in the transaction currency"
        value={form.fee}
        onChange={(e) => setForm({ ...form, fee: e.target.value })}
      />
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
