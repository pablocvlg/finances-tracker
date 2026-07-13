import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SELECT =
  "id, name, amount, fee, currency, category_id, asset_id, frequency, next_date, active, categories(name, type), assets(name)";

export async function GET() {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select(SELECT)
    .order("next_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, amount, fee, currency, category_id, asset_id, frequency, next_date } = body;

  if (!category_id) {
    return NextResponse.json(
      { error: "A category is required: generated transactions take their income/expense type from it" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({
      name,
      amount,
      fee: fee ?? 0,
      currency,
      category_id,
      asset_id: asset_id ?? null,
      frequency,
      next_date,
      active: true,
    })
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
