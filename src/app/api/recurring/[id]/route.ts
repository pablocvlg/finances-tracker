import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SELECT = "id, name, amount, currency, category_id, frequency, next_date, active, categories(name, type)";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, amount, currency, category_id, frequency, next_date, active } = body;

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (amount !== undefined) update.amount = amount;
  if (currency !== undefined) update.currency = currency;
  if (category_id !== undefined) update.category_id = category_id;
  if (frequency !== undefined) update.frequency = frequency;
  if (next_date !== undefined) update.next_date = next_date;
  if (active !== undefined) update.active = active;

  const { data, error } = await supabase
    .from("recurring_transactions")
    .update(update)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
