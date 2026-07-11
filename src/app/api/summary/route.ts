import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Currency, CurrencyTotals } from "@/lib/currency";

function emptyTotals(): CurrencyTotals {
  return { EUR: 0, DKK: 0 };
}

type CategoryBucket = { categoryId: string | null; name: string } & CurrencyTotals;

type Section = {
  total: CurrencyTotals;
  byCategory: CategoryBucket[];
};

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, amount, currency, category_id, categories(name)")
    .gte("date", from)
    .lte("date", to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  function buildSection(type: "income" | "expense"): Section {
    const total = emptyTotals();
    const categories = new Map<string, CategoryBucket>();

    for (const tx of transactions ?? []) {
      if (tx.type !== type) continue;
      const currency = tx.currency as Currency;
      total[currency] += tx.amount;

      const key = tx.category_id ?? "uncategorized";
      const name =
        (tx.categories as unknown as { name: string } | null)?.name ?? "Uncategorized";
      const bucket = categories.get(key) ?? {
        categoryId: tx.category_id,
        name,
        ...emptyTotals(),
      };
      bucket[currency] += tx.amount;
      categories.set(key, bucket);
    }

    return { total, byCategory: Array.from(categories.values()) };
  }

  return NextResponse.json({
    expense: buildSection("expense"),
    income: buildSection("income"),
  });
}
