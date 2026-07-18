"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency, sumInCurrency, type Currency } from "@/lib/currency";
import { addDays, addMonths } from "@/lib/recurrence";
import styles from "./Charts.module.css";

type HistoryPoint = { date: string; EUR: number; DKK: number };

type ChartRange = "1m" | "3m" | "6m" | "1y" | "custom";

const presets: { value: ChartRange; label: string; months: number }[] = [
  { value: "1m", label: "1 month", months: 1 },
  { value: "3m", label: "3 months", months: 3 },
  { value: "6m", label: "6 months", months: 6 },
  { value: "1y", label: "1 year", months: 12 },
];

// Hard cap on rendered days so a stray custom range can't build a huge array.
const MAX_DAYS = 3660;

export default function NetWorthChart({
  history,
  currency,
}: {
  history: HistoryPoint[];
  currency: Currency;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState<ChartRange>("3m");
  const [custom, setCustom] = useState({ from: addMonths(today, -3), to: today });

  if (history.length === 0) {
    return <p className={styles.empty}>No net worth history recorded yet.</p>;
  }

  const preset = presets.find((p) => p.value === range);
  const window = preset ? { from: addMonths(today, -preset.months), to: today } : custom;

  // One entry per day across the whole window; days without history render as
  // gaps so shorter and longer time frames visibly differ even with young data.
  const byDate = new Map(history.map((point) => [point.date, point]));
  const data: { date: string; value: number | null }[] = [];
  if (window.from <= window.to) {
    for (
      let day = window.from;
      day <= window.to && data.length < MAX_DAYS;
      day = addDays(day, 1)
    ) {
      const point = byDate.get(day);
      data.push({
        date: day,
        value: point ? sumInCurrency({ EUR: point.EUR, DKK: point.DKK }, currency) : null,
      });
    }
  }

  const plotted = data.filter((d) => d.value !== null).length;

  return (
    <div>
      <div className={styles.rangeRow}>
        <div className={styles.ranges} role="group" aria-label="Chart range">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              className={range === p.value ? styles.rangeActive : styles.rangeOption}
              onClick={() => setRange(p.value)}
              aria-pressed={range === p.value}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className={range === "custom" ? styles.rangeActive : styles.rangeOption}
            onClick={() => setRange("custom")}
            aria-pressed={range === "custom"}
          >
            Custom
          </button>
        </div>
        {range === "custom" && (
          <div className={styles.customRange}>
            <input
              type="date"
              value={custom.from}
              max={custom.to}
              onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            />
            <span className={styles.separator}>to</span>
            <input
              type="date"
              value={custom.to}
              min={custom.from}
              max={today}
              onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            />
          </div>
        )}
      </div>
      {plotted === 0 ? (
        <p className={styles.empty}>No net worth history in the selected period.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
              tickLine={false}
              width={64}
              tickFormatter={formatCompact}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--series-net-worth)"
              strokeWidth={2}
              dot={
                plotted <= 45
                  ? { r: 4, stroke: "var(--background)", strokeWidth: 2, fill: "var(--series-net-worth)" }
                  : false
              }
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
