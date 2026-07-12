"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency, sumInCurrency, type Currency } from "@/lib/currency";
import type { TrendMonth } from "./MonthlySpendChart";
import styles from "./Charts.module.css";

export default function IncomeExpenseChart({
  months,
  currency,
}: {
  months: TrendMonth[];
  currency: Currency;
}) {
  const data = months.map((month) => ({
    month: month.month,
    Income: sumInCurrency(month.income, currency),
    Expenses: sumInCurrency(month.expense, currency),
  }));

  if (data.every((row) => row.Income === 0 && row.Expenses === 0)) {
    return <p className={styles.empty}>No transactions recorded in this period.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="month"
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
        <Legend
          iconType="square"
          iconSize={10}
          formatter={(value) => (
            <span style={{ color: "var(--foreground-muted)", fontSize: 12 }}>{value}</span>
          )}
        />
        <Bar dataKey="Income" fill="var(--series-2)" maxBarSize={24} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expenses" fill="var(--series-6)" maxBarSize={24} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
