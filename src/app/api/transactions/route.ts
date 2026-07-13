import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { applyTransaction, TRANSACTION_SELECT, type TxMoneyFields } from "@/lib/transactionOps";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const categoryId = params.get("category_id");
  const from = params.get("from");
  const to = params.get("to");

  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
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
  const { date, type, category_id, asset_id, to_asset_id, amount, received_amount, fee, currency, description } = body;

  if (type === "exchange" && (!asset_id || !to_asset_id || asset_id === to_asset_id)) {
    return NextResponse.json({ error: "An exchange needs two different assets" }, { status: 400 });
  }

  const row = {
    date,
    type,
    category_id: type === "exchange" ? null : category_id ?? null,
    asset_id: asset_id ?? null,
    to_asset_id: type === "exchange" ? to_asset_id : null,
    amount,
    received_amount: type === "exchange" ? received_amount ?? null : null,
    fee: fee ?? 0,
    currency,
    description: description ?? null,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(row)
    .select(TRANSACTION_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const applyError = await applyTransaction(row as TxMoneyFields, 1);
  if (applyError) return NextResponse.json({ error: applyError }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
