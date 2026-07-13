import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("investments")
    .select("id, symbol, name, quantity, buy_price, buy_currency, created_at")
    .order("symbol", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { symbol, name, quantity, buy_price, buy_currency } = body;

  const { data, error } = await supabase
    .from("investments")
    .insert({
      symbol: String(symbol).trim().toUpperCase(),
      name: name || null,
      quantity,
      buy_price: buy_price ?? null,
      buy_currency: buy_price != null ? (buy_currency ?? "EUR") : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
