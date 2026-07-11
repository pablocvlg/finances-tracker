import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const categoryId = params.get("category_id");
  const from = params.get("from");
  const to = params.get("to");

  let query = supabase
    .from("transactions")
    .select("id, date, type, category_id, amount, currency, description, categories(name)")
    .order("date", { ascending: false });

  if (type) query = query.eq("type", type);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, type, category_id, amount, currency, description } = body;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      date,
      type,
      category_id: category_id ?? null,
      amount,
      currency,
      description: description ?? null,
    })
    .select("id, date, type, category_id, amount, currency, description, categories(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
