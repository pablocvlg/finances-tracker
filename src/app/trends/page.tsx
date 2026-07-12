"use client";

import { useEffect, useState } from "react";
import CurrencyToggle from "@/components/CurrencyToggle";
import NetWorthChart from "@/components/NetWorthChart";
import MonthlySpendChart, { type TrendMonth } from "@/components/MonthlySpendChart";
import IncomeExpenseChart from "@/components/IncomeExpenseChart";
import type { Currency, CurrencyTotals } from "@/lib/currency";
import styles from "../shared.module.css";
import pageStyles from "./page.module.css";

type NetWorthResponse = {
  total: CurrencyTotals;
  history: ({ date: string } & CurrencyTotals)[];
};

const spans = [3, 6, 12] as const;

export default function Trends() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [span, setSpan] = useState<number>(6);
  const [netWorth, setNetWorth] = useState<NetWorthResponse | null>(null);
  const [months, setMonths] = useState<TrendMonth[]>([]);

  useEffect(() => {
    fetch("/api/net-worth")
      .then((res) => res.json())
      .then(setNetWorth);
  }, []);

  useEffect(() => {
    fetch(`/api/trends?months=${span}`)
      .then((res) => res.json())
      .then(setMonths);
  }, [span]);

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <h1 className={styles.heading}>Trends</h1>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

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
