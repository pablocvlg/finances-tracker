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
import {
  formatCompact,
  formatCurrency,
  sumInCurrency,
  type Currency,
  type CurrencyTotals,
} from "@/lib/currency";
import { assignCategoryColors } from "@/lib/chartColors";
import styles from "./Charts.module.css";

export type TrendMonth = {
  month: string;
  income: CurrencyTotals;
  expense: CurrencyTotals;
  categories: ({ name: string } & CurrencyTotals)[];
};

const MAX_CATEGORIES = 5;

export default function MonthlySpendChart({
  months,
  currency,
}: {
  months: TrendMonth[];
  currency: Currency;
}) {
  const totalsByCategory = new Map<string, number>();
  for (const month of months) {
    for (const cat of month.categories) {
      const value = sumInCurrency({ EUR: cat.EUR, DKK: cat.DKK }, currency);
      totalsByCategory.set(cat.name, (totalsByCategory.get(cat.name) ?? 0) + value);
    }
  }

  if (totalsByCategory.size === 0) {
    return <p className={styles.empty}>No expenses recorded in this period.</p>;
  }

  const ranked = Array.from(totalsByCategory.entries()).sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, MAX_CATEGORIES).map(([name]) => name);
  const hasOther = ranked.length > MAX_CATEGORIES;
  const colors = assignCategoryColors(top);

  const data = months.map((month) => {
    const row: Record<string, number | string> = { month: month.month };
    let other = 0;
    for (const cat of month.categories) {
      const value = sumInCurrency({ EUR: cat.EUR, DKK: cat.DKK }, currency);
      if (top.includes(cat.name)) {
        row[cat.name] = value;
      } else {
        other += value;
      }
    }
    if (hasOther) row.Other = other;
    return row;
  });

  const series = hasOther ? [...top, "Other"] : top;

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
        {series.map((name) => (
          <Bar
            key={name}
            dataKey={name}
            stackId="spend"
            maxBarSize={24}
            fill={name === "Other" ? "var(--chart-axis)" : colors.get(name)}
            stroke="var(--background)"
            strokeWidth={1}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
