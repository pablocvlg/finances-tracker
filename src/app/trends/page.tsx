"use client";

import { useEffect, useState } from "react";
import CurrencyToggle from "@/components/CurrencyToggle";
import NetWorthChart from "@/components/NetWorthChart";
import MonthlySpendChart, { type TrendMonth } from "@/components/MonthlySpendChart";
import IncomeExpenseChart from "@/components/IncomeExpenseChart";
import type { Currency, CurrencyTotals } from "@/lib/currency";
import { addMonths } from "@/lib/recurrence";
import styles from "../shared.module.css";
import pageStyles from "./page.module.css";

type NetWorthResponse = {
  total: CurrencyTotals;
  history: ({ date: string } & CurrencyTotals)[];
};

const spans = [3, 6, 12] as const;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function Trends() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [span, setSpan] = useState<number | "custom">(6);
  const [customFrom, setCustomFrom] = useState(() =>
    addMonths(currentMonth() + "-01", -5).slice(0, 7)
  );
  const [customTo, setCustomTo] = useState(currentMonth);
  const [netWorth, setNetWorth] = useState<NetWorthResponse | null>(null);
  const [months, setMonths] = useState<TrendMonth[]>([]);

  useEffect(() => {
    fetch("/api/net-worth")
      .then((res) => res.json())
      .then(setNetWorth);
  }, []);

  useEffect(() => {
    const query =
      span === "custom"
        ? customFrom && customTo && customFrom <= customTo
          ? `from=${customFrom}&to=${customTo}`
          : null
        : `months=${span}`;
    if (!query) return;
    fetch(`/api/trends?${query}`)
      .then((res) => res.json())
      .then(setMonths);
  }, [span, customFrom, customTo]);

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <h1 className={styles.heading}>Trends</h1>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <div className={pageStyles.controls}>
        <div className={pageStyles.spanRow} role="group" aria-label="Months shown">
          {spans.map((value) => (
            <button
              key={value}
              type="button"
              className={span === value ? pageStyles.spanActive : pageStyles.span}
              onClick={() => setSpan(value)}
              aria-pressed={span === value}
            >
              {value} months
            </button>
          ))}
          <button
            type="button"
            className={span === "custom" ? pageStyles.spanActive : pageStyles.span}
            onClick={() => setSpan("custom")}
            aria-pressed={span === "custom"}
          >
            Custom
          </button>
        </div>
        {span === "custom" && (
          <div className={pageStyles.customRange}>
            <input
              type="month"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span className={pageStyles.separator}>to</span>
            <input
              type="month"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}
      </div>

      <section className={pageStyles.chartSection}>
        <h2 className={styles.subheading}>Net worth over time</h2>
        {netWorth && <NetWorthChart history={netWorth.history} currency={currency} />}
      </section>

      <section className={pageStyles.chartSection}>
        <h2 className={styles.subheading}>Monthly spend by category</h2>
        <MonthlySpendChart months={months} currency={currency} />
      </section>

      <section className={pageStyles.chartSection}>
        <h2 className={styles.subheading}>Income vs expenses</h2>
        <IncomeExpenseChart months={months} currency={currency} />
      </section>
    </main>
  );
}
