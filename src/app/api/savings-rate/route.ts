import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addMonths } from "@/lib/recurrence";
import type { Currency, CurrencyTotals } from "@/lib/currency";

export async function GET(request: NextRequest) {
  const monthsParam = parseInt(request.nextUrl.searchParams.get("months") ?? "6", 10);
  const months = Math.min(Math.max(monthsParam, 1), 60);

  // Rolling window: exactly the last N months through today, so recent
  // transactions count immediately. The window is always exactly N months
  // long, so dividing the total by N is not skewed by partial months.
  const today = new Date().toISOString().slice(0, 10);
  const from = addMonths(today, -months);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("date, type, amount, fee, currency")
    .gt("date", from)
    .lte("date", today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calendar-month buckets for the history; the first and last may be partial.
  const byMonth = new Map<string, CurrencyTotals>();
  for (let m = from.slice(0, 7); m <= today.slice(0, 7); m = addMonths(m + "-01", 1).slice(0, 7)) {
    byMonth.set(m, { EUR: 0, DKK: 0 });
  }

  for (const tx of transactions ?? []) {
    const bucket = byMonth.get(tx.date.slice(0, 7));
    if (!bucket) continue;
    // Exchange principal is neutral for savings; fees always cost money.
    const principal =
      tx.type === "income" ? tx.amount : tx.type === "expense" ? -tx.amount : 0;
    bucket[tx.currency as Currency] += principal - tx.fee;
  }

  const history = Array.from(byMonth.entries()).map(([month, net]) => ({ month, net }));
  const average: CurrencyTotals = { EUR: 0, DKK: 0 };
  for (const { net } of history) {
    average.EUR += net.EUR / months;
    average.DKK += net.DKK / months;
  }

  return NextResponse.json({ months, history, average });
}
