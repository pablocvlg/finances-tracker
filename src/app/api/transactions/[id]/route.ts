import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, type, category_id, amount, currency, description } = body;

  const update: Record<string, unknown> = {};
  if (date !== undefined) update.date = date;
  if (type !== undefined) update.type = type;
  if (category_id !== undefined) update.category_id = category_id;
  if (amount !== undefined) update.amount = amount;
  if (currency !== undefined) update.currency = currency;
  if (description !== undefined) update.description = description;

  const { data, error } = await supabase
    .from("transactions")
    .update(update)
    .eq("id", id)
    .select("id, date, type, category_id, amount, currency, description, categories(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
