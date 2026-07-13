import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Currency, CurrencyTotals } from "@/lib/currency";

function emptyTotals(): CurrencyTotals {
  return { EUR: 0, DKK: 0 };
}

type CategoryBucket = { categoryId: string | null; name: string } & CurrencyTotals;

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, amount, fee, currency, category_id, categories(name)")
    .gte("date", from)
    .lte("date", to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const expenseTotal = emptyTotals();
  const incomeTotal = emptyTotals();
  const expenseCategories = new Map<string, CategoryBucket>();
  const incomeCategories = new Map<string, CategoryBucket>();

  function add(map: Map<string, CategoryBucket>, key: string, name: string, categoryId: string | null, currency: Currency, amount: number) {
    const bucket = map.get(key) ?? { categoryId, name, ...emptyTotals() };
    bucket[currency] += amount;
    map.set(key, bucket);
  }

  for (const tx of transactions ?? []) {
    const currency = tx.currency as Currency;
    const name = (tx.categories as unknown as { name: string } | null)?.name ?? "Uncategorized";

    if (tx.type === "expense") {
      expenseTotal[currency] += tx.amount;
      add(expenseCategories, tx.category_id ?? "uncategorized", name, tx.category_id, currency, tx.amount);
    } else if (tx.type === "income") {
      incomeTotal[currency] += tx.amount;
      add(incomeCategories, tx.category_id ?? "uncategorized", name, tx.category_id, currency, tx.amount);
    }

    // Fees on any transaction (incl. exchanges) count as spend, under one bucket.
    if (tx.fee > 0) {
      expenseTotal[currency] += tx.fee;
      add(expenseCategories, "fees", "Fees", null, currency, tx.fee);
    }
  }

  return NextResponse.json({
    expense: { total: expenseTotal, byCategory: Array.from(expenseCategories.values()) },
    income: { total: incomeTotal, byCategory: Array.from(incomeCategories.values()) },
  });
}
