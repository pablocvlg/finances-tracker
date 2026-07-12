"use client";

import { useEffect, useState } from "react";
import type { Asset, AssetType } from "@/lib/types";
import type { Currency } from "@/lib/currency";
import { formatCurrency } from "@/lib/currency";
import styles from "./AssetManager.module.css";
import formStyles from "./TransactionForm.module.css";

const assetTypes: AssetType[] = ["cash", "bank", "stocks", "other"];

const emptyForm = {
  name: "",
  type: "bank" as AssetType,
  current_value: "",
  currency: "EUR" as Currency,
};

export default function AssetManager({
  assets,
  onChanged,
}: {
  assets: Asset[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Asset | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        current_value: String(editing.current_value),
        currency: editing.currency,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      type: form.type,
      current_value: parseFloat(form.current_value),
      currency: form.currency,
    };

    if (editing) {
      await fetch(`/api/assets/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditing(null);
    setForm(emptyForm);
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset and its snapshot history?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Assets</h2>

      <form className={formStyles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          className={formStyles.description}
          placeholder="Name (e.g. Main bank account)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className={formStyles.select}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })}
        >
          {assetTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          className={formStyles.amount}
          placeholder="Value"
          value={form.current_value}
          onChange={(e) => setForm({ ...form, current_value: e.target.value })}
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
        <button type="submit" className={formStyles.submit}>
          {editing ? "Save" : "Add"}
        </button>
        {editing && (
          <button type="button" className={formStyles.cancel} onClick={() => setEditing(null)}>
            Cancel
          </button>
        )}
      </form>

      {assets.length === 0 ? (
        <p className={styles.empty}>No assets yet. Add one to start tracking net worth.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th className={styles.value}>Value</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.type}</td>
                <td className={styles.value}>
                  {formatCurrency(asset.current_value, asset.currency)}
                </td>
                <td>{asset.updated_at.slice(0, 10)}</td>
                <td className={styles.actions}>
                  <button type="button" onClick={() => setEditing(asset)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(asset.id)}>
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
