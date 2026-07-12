import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addMonths } from "@/lib/recurrence";
import type { Currency, CurrencyTotals } from "@/lib/currency";

export async function GET(request: NextRequest) {
  const monthsParam = parseInt(request.nextUrl.searchParams.get("months") ?? "6", 10);
  const months = Math.min(Math.max(monthsParam, 1), 24);

  // Only complete months: from the 1st of (current month - N) through the last
  // day of the previous month, so a half-elapsed current month doesn't skew the rate.
  const today = new Date().toISOString().slice(0, 10);
  const currentMonthStart = today.slice(0, 7) + "-01";
  const from = addMonths(currentMonthStart, -months);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("date, type, amount, currency")
    .gte("date", from)
    .lt("date", currentMonthStart);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byMonth = new Map<string, CurrencyTotals>();
  for (let i = 0; i < months; i++) {
    byMonth.set(addMonths(from, i).slice(0, 7), { EUR: 0, DKK: 0 });
  }

  for (const tx of transactions ?? []) {
    const bucket = byMonth.get(tx.date.slice(0, 7));
    if (!bucket) continue;
    const sign = tx.type === "income" ? 1 : -1;
    bucket[tx.currency as Currency] += sign * tx.amount;
  }

  const history = Array.from(byMonth.entries()).map(([month, net]) => ({ month, net }));
  const average: CurrencyTotals = { EUR: 0, DKK: 0 };
  for (const { net } of history) {
    average.EUR += net.EUR / months;
    average.DKK += net.DKK / months;
  }

  return NextResponse.json({ months, history, average });
}
