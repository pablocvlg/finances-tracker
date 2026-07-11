"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, sumInCurrency, type Currency } from "@/lib/currency";
import { assignCategoryColors } from "@/lib/chartColors";
import styles from "./Charts.module.css";

type CategoryBucket = { categoryId: string | null; name: string; EUR: number; DKK: number };

const MAX_CATEGORIES = 7;

export default function CategoryBreakdown({
  buckets,
  currency,
}: {
  buckets: CategoryBucket[];
  currency: Currency;
}) {
  const items = buckets
    .map((bucket) => ({
      key: bucket.categoryId ?? bucket.name,
      name: bucket.name,
      value: sumInCurrency({ EUR: bucket.EUR, DKK: bucket.DKK }, currency),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (items.length === 0) {
    return <p className={styles.empty}>No transactions in this period.</p>;
  }

  const colors = assignCategoryColors(items.map((item) => item.key));

  const top = items.slice(0, MAX_CATEGORIES);
  const rest = items.slice(MAX_CATEGORIES);
  const data = rest.length > 0
    ? [...top, { key: "other", name: "Other", value: rest.reduce((sum, i) => sum + i.value, 0) }]
    : top;

  const height = Math.max(120, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
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
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((item) => (
            <Cell
              key={item.key}
              fill={item.key === "other" ? "var(--chart-axis)" : colors.get(item.key)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
