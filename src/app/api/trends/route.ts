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

const MONTH_RE = /^\d{4}-\d{2}$/;
const MAX_MONTHS = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fromParam = params.get("from");
  const toParam = params.get("to");

  let from: string;
  let months: number;

  if (fromParam && toParam && MONTH_RE.test(fromParam) && MONTH_RE.test(toParam) && fromParam <= toParam) {
    // Explicit month range (YYYY-MM, inclusive).
    from = fromParam + "-01";
    const [fy, fm] = fromParam.split("-").map(Number);
    const [ty, tm] = toParam.split("-").map(Number);
    months = Math.min((ty - fy) * 12 + (tm - fm) + 1, MAX_MONTHS);
  } else {
    // Last N months including the current (partial) one.
    const monthsParam = parseInt(params.get("months") ?? "6", 10);
    months = Math.min(Math.max(monthsParam, 1), MAX_MONTHS);
    const currentMonthStart = new Date().toISOString().slice(0, 7) + "-01";
    from = addMonths(currentMonthStart, -(months - 1));
  }

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
