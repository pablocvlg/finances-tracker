"use client";

import { useCallback, useEffect, useState } from "react";
import CurrencyToggle from "@/components/CurrencyToggle";
import { convert, formatCurrency, parseAmount, type Currency } from "@/lib/currency";
import type { Asset, Investment, Quote } from "@/lib/types";
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

const emptySellForm = {
  date: new Date().toISOString().slice(0, 10),
  quantity: "",
  price: "",
  currency: "EUR" as Currency,
  fee: "",
  asset_id: "",
};

export default function Investments() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [holdings, setHoldings] = useState<Investment[]>([]);
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selling, setSelling] = useState<Investment | null>(null);
  const [sellForm, setSellForm] = useState(emptySellForm);
  const [sellError, setSellError] = useState<string | null>(null);

  const loadHoldings = useCallback(() => {
    fetch("/api/investments")
      .then((res) => res.json())
      .then(setHoldings);
  }, []);

  useEffect(loadHoldings, [loadHoldings]);

  useEffect(() => {
    fetch("/api/assets")
      .then((res) => res.json())
      .then(setAssets);
  }, []);

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

  function startSelling(holding: Investment) {
    const quote = quotes.get(holding.symbol);
    const quoteInAppCurrency =
      quote?.price != null && (quote.currency === "EUR" || quote.currency === "DKK");
    setSelling(holding);
    setSellError(null);
    setSellForm({
      ...emptySellForm,
      quantity: String(holding.quantity),
      price: quoteInAppCurrency ? String(quote.price) : "",
      currency: quoteInAppCurrency ? (quote.currency as Currency) : "EUR",
    });
  }

  async function handleSell(e: React.FormEvent) {
    e.preventDefault();
    if (!selling) return;
    const quantity = parseAmount(sellForm.quantity);
    const price = parseAmount(sellForm.price);
    const fee = parseAmount(sellForm.fee);
    if (isNaN(quantity) || isNaN(price) || !sellForm.asset_id) return;

    const res = await fetch(`/api/investments/${selling.id}/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: sellForm.date,
        quantity,
        price,
        currency: sellForm.currency,
        fee: !isNaN(fee) && fee > 0 ? fee : 0,
        asset_id: sellForm.asset_id,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSellError(body?.error ?? `Sale failed (HTTP ${res.status})`);
      return;
    }

    setSelling(null);
    setSellForm(emptySellForm);
    setSellError(null);
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

      {selling && (
        <form className={formStyles.form} onSubmit={handleSell}>
          <span className={pageStyles.sellLabel}>Sell {selling.symbol}</span>
          <input
            type="date"
            className={formStyles.input}
            value={sellForm.date}
            onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })}
            required
          />
          <input
            type="text"
            inputMode="decimal"
            className={formStyles.fee}
            placeholder={`Qty (max ${selling.quantity})`}
            title={`Quantity to sell, up to ${selling.quantity}`}
            value={sellForm.quantity}
            onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
            required
          />
          <input
            type="text"
            inputMode="decimal"
            className={formStyles.amount}
            placeholder="Price / unit"
            value={sellForm.price}
            onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })}
            required
          />
          <select
            className={formStyles.select}
            value={sellForm.currency}
            onChange={(e) => setSellForm({ ...sellForm, currency: e.target.value as Currency })}
          >
            <option value="EUR">EUR</option>
            <option value="DKK">DKK</option>
          </select>
          <input
            type="text"
            inputMode="decimal"
            className={formStyles.fee}
            placeholder="Fee"
            title="Optional broker fee, in the sale currency"
            value={sellForm.fee}
            onChange={(e) => setSellForm({ ...sellForm, fee: e.target.value })}
          />
          <select
            className={formStyles.select}
            value={sellForm.asset_id}
            onChange={(e) => setSellForm({ ...sellForm, asset_id: e.target.value })}
            required
            aria-label="Credit proceeds to"
          >
            <option value="">
              {assets.length === 0 ? "No assets yet — add one on Home" : "Credit to…"}
            </option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
          <button type="submit" className={formStyles.submit}>
            Sell
          </button>
          <button type="button" className={formStyles.cancel} onClick={() => setSelling(null)}>
            Cancel
          </button>
          {sellError && <span className={pageStyles.error}>{sellError}</span>}
        </form>
      )}

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
                    <button type="button" onClick={() => startSelling(holding)}>
                      Sell
                    </button>
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
