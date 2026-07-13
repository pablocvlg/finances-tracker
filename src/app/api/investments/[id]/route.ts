import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { symbol, name, quantity, buy_price, buy_currency } = body;

  const update: Record<string, unknown> = {};
  if (symbol !== undefined) update.symbol = String(symbol).trim().toUpperCase();
  if (name !== undefined) update.name = name;
  if (quantity !== undefined) update.quantity = quantity;
  if (buy_price !== undefined) update.buy_price = buy_price;
  if (buy_currency !== undefined) update.buy_currency = buy_currency;

  const { data, error } = await supabase
    .from("investments")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("investments").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
