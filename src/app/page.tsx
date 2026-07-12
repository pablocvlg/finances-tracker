"use client";

import { useCallback, useEffect, useState } from "react";
import AssetManager from "@/components/AssetManager";
import CurrencyToggle from "@/components/CurrencyToggle";
import DateRangeSelector from "@/components/DateRangeSelector";
import NetWorthChart from "@/components/NetWorthChart";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import { formatCurrency, sumInCurrency, type Currency, type CurrencyTotals } from "@/lib/currency";
import { resolveRange, type RangePreset } from "@/lib/dateRange";
import type { Asset } from "@/lib/types";
import styles from "./shared.module.css";

type CategoryBucket = { categoryId: string | null; name: string } & CurrencyTotals;
type Section = { total: CurrencyTotals; byCategory: CategoryBucket[] };
type NetWorthResponse = {
  total: CurrencyTotals;
  history: ({ date: string } & CurrencyTotals)[];
};
type SummaryResponse = { expense: Section; income: Section };

export default function Home() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [rangePreset, setRangePreset] = useState<RangePreset>("month");
  const [customRange, setCustomRange] = useState(() => resolveRange("month"));

  const [netWorth, setNetWorth] = useState<NetWorthResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  const loadNetWorth = useCallback(() => {
    fetch("/api/net-worth")
      .then((res) => res.json())
      .then(setNetWorth);
  }, []);

  const loadAssets = useCallback(() => {
    fetch("/api/assets")
      .then((res) => res.json())
      .then(setAssets);
  }, []);

  useEffect(loadNetWorth, [loadNetWorth]);
  useEffect(loadAssets, [loadAssets]);

  const { from, to } = resolveRange(rangePreset, customRange);

  useEffect(() => {
    fetch(`/api/summary?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then(setSummary);
  }, [from, to]);

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <h1 className={styles.heading}>Net worth</h1>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <p className={styles.hero}>
        {netWorth ? formatCurrency(sumInCurrency(netWorth.total, currency), currency) : "—"}
      </p>

      {netWorth && <NetWorthChart history={netWorth.history} currency={currency} />}

      <div className={styles.section}>
        <DateRangeSelector
          value={rangePreset}
          custom={customRange}
          onChange={setRangePreset}
          onCustomChange={setCustomRange}
        />
      </div>

      <div className={styles.statRow}>
        <div className={styles.statTile}>
          <span className={styles.statLabel}>Expenses</span>
          <span className={styles.statValue}>
            {summary
              ? formatCurrency(sumInCurrency(summary.expense.total, currency), currency)
              : "—"}
          </span>
        </div>
        <div className={styles.statTile}>
          <span className={styles.statLabel}>Income</span>
          <span className={styles.statValue}>
            {summary
              ? formatCurrency(sumInCurrency(summary.income.total, currency), currency)
              : "—"}
          </span>
        </div>
      </div>

      <div className={styles.breakdownGrid}>
        <div>
          <h2 className={styles.subheading}>Expenses by category</h2>
          {summary && (
            <CategoryBreakdown buckets={summary.expense.byCategory} currency={currency} />
          )}
        </div>
        <div>
          <h2 className={styles.subheading}>Income by category</h2>
          {summary && (
            <CategoryBreakdown buckets={summary.income.byCategory} currency={currency} />
          )}
        </div>
      </div>

      <AssetManager
        assets={assets}
        onChanged={() => {
          loadAssets();
          loadNetWorth();
        }}
      />
    </main>
  );
}
