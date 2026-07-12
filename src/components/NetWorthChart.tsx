"use client";

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
import styles from "./Charts.module.css";

type HistoryPoint = { date: string; EUR: number; DKK: number };

export default function NetWorthChart({
  history,
  currency,
}: {
  history: HistoryPoint[];
  currency: Currency;
}) {
  if (history.length === 0) {
    return <p className={styles.empty}>No net worth history recorded yet.</p>;
  }

  const data = history.map((point) => ({
    date: point.date,
    value: sumInCurrency({ EUR: point.EUR, DKK: point.DKK }, currency),
  }));

  return (
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
          dot={{ r: 4, stroke: "var(--background)", strokeWidth: 2, fill: "var(--series-net-worth)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
