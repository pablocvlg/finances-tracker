"use client";

import { useCallback, useEffect, useState } from "react";
import CurrencyToggle from "@/components/CurrencyToggle";
import { convert, formatCurrency, parseAmount, type Currency } from "@/lib/currency";
import type { Investment, Quote } from "@/lib/types";
import styles from "../shared.module.css";
import pageStyles from "./page.module.css";
import formStyles from "@/components/TransactionForm.module.css";

const emptyForm = {
  symbol: "",
  name: "",
  quantity: "",
  buy_price: "",
  buy_currency: "EUR" as "EUR" | "DKK" | "USD",
};

export default function Investments() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [holdings, setHoldings] = useState<Investment[]>([]);
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Investment | null>(null);

  const loadHoldings = useCallback(() => {
    fetch("/api/investments")
      .then((res) => res.json())
      .then(setHoldings);
  }, []);

  useEffect(loadHoldings, [loadHoldings]);

  // Live prices refresh on every visit and whenever holdings change.
  useEffect(() => {
    const symbols = [...new Set(holdings.map((h) => h.symbol))];
    if (symbols.length === 0) return;
    setLoadingQuotes(true);
    fetch(`/api/investments/quotes?symbols=${symbols.map(encodeURIComponent).join(",")}`)
      .then((res) => res.json())
      .then((data: Quote[]) => setQuotes(new Map(data.map((q) => [q.symbol, q]))))
      .finally(() => setLoadingQuotes(false));
  }, [holdings]);

  useEffect(() => {
    if (editing) {
      setForm({
        symbol: editing.symbol,
        name: editing.name ?? "",
        quantity: String(editing.quantity),
        buy_price: editing.buy_price != null ? String(editing.buy_price) : "",
        buy_currency: editing.buy_currency ?? "EUR",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = parseAmount(form.quantity);
    if (!form.symbol.trim() || isNaN(quantity) || quantity <= 0) return;
    const buyPrice = parseAmount(form.buy_price);

    const payload = {
      symbol: form.symbol.trim(),
      name: form.name.trim() || null,
      quantity,
      buy_price: !isNaN(buyPrice) && buyPrice > 0 ? buyPrice : null,
      buy_currency: form.buy_currency,
    };

    if (editing) {
      await fetch(`/api/investments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditing(null);
    setForm(emptyForm);
    loadHoldings();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this holding?")) return;
    await fetch(`/api/investments/${id}`, { method: "DELETE" });
    loadHoldings();
  }

  function valueOf(holding: Investment): number | null {
    const quote = quotes.get(holding.symbol);
    if (!quote || quote.priceEUR == null) return null;
    return convert(quote.priceEUR * holding.quantity, "EUR", currency);
  }

  const total = holdings.reduce((sum, h) => sum + (valueOf(h) ?? 0), 0);
  const anyPriced = holdings.some((h) => valueOf(h) != null);

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <h1 className={styles.heading}>Investments</h1>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <p className={styles.hero}>{anyPriced ? formatCurrency(total, currency) : "—"}</p>
      <p className={pageStyles.status}>
        {loadingQuotes
          ? "Fetching live prices…"
          : anyPriced
            ? "Live market prices via Yahoo Finance; FX via the ECB."
            : "Add a holding to see its live value."}
      </p>

      <form className={formStyles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          className={formStyles.amount}
          placeholder="Symbol (e.g. VWCE.DE)"
          title="Ticker symbol as listed on Yahoo Finance, e.g. AAPL, VWCE.DE, NOVO-B.CO"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          required
        />
        <input
          type="text"
          className={formStyles.description}
          placeholder="Name (optional)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="text"
          inputMode="decimal"
          className={formStyles.fee}
          placeholder="Qty"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />
        <input
          type="text"
          inputMode="decimal"
          className={formStyles.amount}
          placeholder="Buy price / unit"
          value={form.buy_price}
          onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
        />
        <select
          className={formStyles.select}
          value={form.buy_currency}
          onChange={(e) =>
            setForm({ ...form, buy_currency: e.target.value as "EUR" | "DKK" | "USD" })
          }
        >
          <option value="EUR">EUR</option>
          <option value="DKK">DKK</option>
          <option value="USD">USD</option>
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

      {holdings.length === 0 ? (
        <p className={styles.placeholder}>
          No holdings yet. Add a stock or ETF by its Yahoo Finance ticker.
        </p>
      ) : (
        <table className={pageStyles.table}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th className={pageStyles.nameCol}>Name</th>
              <th className={pageStyles.num}>Qty</th>
              <th className={pageStyles.num}>Buy price</th>
              <th className={pageStyles.num}>Price</th>
              <th className={pageStyles.num}>Day</th>
              <th className={pageStyles.num}>Gain</th>
              <th className={pageStyles.num}>Value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const quote = quotes.get(holding.symbol);
              const value = valueOf(holding);
              const dayPct =
                quote?.price != null && quote.prevClose
                  ? ((quote.price - quote.prevClose) / quote.prevClose) * 100
                  : null;
              const gainPct =
                quote?.price != null &&
                holding.buy_price != null &&
                holding.buy_currency === quote.currency
                  ? ((quote.price - holding.buy_price) / holding.buy_price) * 100
                  : null;

              return (
                <tr key={holding.id}>
                  <td>{holding.symbol}</td>
                  <td className={pageStyles.nameCol}>{holding.name ?? ""}</td>
                  <td className={pageStyles.num}>{holding.quantity}</td>
                  <td className={pageStyles.num}>
                    {holding.buy_price != null
                      ? `${holding.buy_price} ${holding.buy_currency}`
                      : "—"}
                  </td>
                  <td className={pageStyles.num}>
                    {quote?.price != null
                      ? `${quote.price.toFixed(2)} ${quote.currency}`
                      : (quote?.error ?? "…")}
                  </td>
                  <td
                    className={`${pageStyles.num} ${dayPct == null ? "" : dayPct >= 0 ? pageStyles.up : pageStyles.down}`}
                  >
                    {dayPct != null ? `${dayPct >= 0 ? "+" : ""}${dayPct.toFixed(2)}%` : "—"}
                  </td>
                  <td
                    className={`${pageStyles.num} ${gainPct == null ? "" : gainPct >= 0 ? pageStyles.up : pageStyles.down}`}
                  >
                    {gainPct != null ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className={pageStyles.num}>
                    {value != null ? formatCurrency(value, currency) : "—"}
                  </td>
                  <td className={pageStyles.actions}>
                    <button type="button" onClick={() => setEditing(holding)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(holding.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
