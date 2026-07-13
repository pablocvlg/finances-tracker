import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { advanceDate } from "@/lib/recurrence";
import { applyToAsset } from "@/lib/assetOps";
import type { Currency } from "@/lib/currency";
import type { Frequency, TransactionType } from "@/lib/types";

export async function POST() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from("recurring_transactions")
    .select("id, name, amount, fee, currency, category_id, asset_id, frequency, next_date, categories(type)")
    .eq("active", true)
    .lte("next_date", today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let generated = 0;

  for (const rule of due ?? []) {
    const type = (rule.categories as unknown as { type: TransactionType } | null)?.type;
    if (!type) continue; // category was deleted; can't derive income/expense

    const inserts = [];
    let date = rule.next_date as string;
    while (date <= today) {
      inserts.push({
        date,
        type,
        category_id: rule.category_id,
        asset_id: rule.asset_id,
        amount: rule.amount,
        fee: rule.fee,
        currency: rule.currency,
        description: rule.name,
        recurring_id: rule.id,
      });
      date = advanceDate(date, rule.frequency as Frequency);
    }

    const { error: insertError } = await supabase.from("transactions").insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("recurring_transactions")
      .update({ next_date: date })
      .eq("id", rule.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (rule.asset_id) {
      const net = type === "expense" ? -(rule.amount + rule.fee) : rule.amount - rule.fee;
      const applyError = await applyToAsset(
        rule.asset_id,
        net * inserts.length,
        rule.currency as Currency
      );
      if (applyError) return NextResponse.json({ error: applyError }, { status: 500 });
    }

    generated += inserts.length;
  }

  return NextResponse.json({ generated });
}
