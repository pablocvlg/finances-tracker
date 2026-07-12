import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addMonths } from "@/lib/recurrence";
import type { Currency, CurrencyTotals } from "@/lib/currency";

function emptyTotals(): CurrencyTotals {
  return { EUR: 0, DKK: 0 };
}

type MonthBucket = {
  month: string;
  income: CurrencyTotals;
  expense: CurrencyTotals;
  categories: Map<string, CurrencyTotals>;
};

export async function GET(request: NextRequest) {
  const monthsParam = parseInt(request.nextUrl.searchParams.get("months") ?? "6", 10);
  const months = Math.min(Math.max(monthsParam, 1), 24);

  // Last N months including the current (partial) one.
  const currentMonthStart = new Date().toISOString().slice(0, 7) + "-01";
  const from = addMonths(currentMonthStart, -(months - 1));

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("date, type, amount, currency, categories(name)")
    .gte("date", from);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byMonth = new Map<string, MonthBucket>();
  for (let i = 0; i < months; i++) {
    const month = addMonths(from, i).slice(0, 7);
    byMonth.set(month, { month, income: emptyTotals(), expense: emptyTotals(), categories: new Map() });
  }

  for (const tx of transactions ?? []) {
    const bucket = byMonth.get(tx.date.slice(0, 7));
    if (!bucket) continue;
    const currency = tx.currency as Currency;

    if (tx.type === "income") {
      bucket.income[currency] += tx.amount;
    } else {
      bucket.expense[currency] += tx.amount;
      const name = (tx.categories as unknown as { name: string } | null)?.name ?? "Uncategorized";
      const categoryTotals = bucket.categories.get(name) ?? emptyTotals();
      categoryTotals[currency] += tx.amount;
      bucket.categories.set(name, categoryTotals);
    }
  }

  const result = Array.from(byMonth.values()).map((bucket) => ({
    month: bucket.month,
    income: bucket.income,
    expense: bucket.expense,
    categories: Array.from(bucket.categories.entries()).map(([name, totals]) => ({
      name,
      ...totals,
    })),
  }));

  return NextResponse.json(result);
}
