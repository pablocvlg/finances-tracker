import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { applyTransaction, TRANSACTION_SELECT, type TxMoneyFields } from "@/lib/transactionOps";

const MONEY_FIELDS = "type, amount, fee, received_amount, currency, asset_id, to_asset_id";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, type, category_id, asset_id, to_asset_id, amount, received_amount, fee, currency, description } = body;

  const { data: old, error: oldError } = await supabase
    .from("transactions")
    .select(MONEY_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 500 });
  if (!old) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (date !== undefined) update.date = date;
  if (type !== undefined) update.type = type;
  if (category_id !== undefined) update.category_id = category_id;
  if (asset_id !== undefined) update.asset_id = asset_id;
  if (to_asset_id !== undefined) update.to_asset_id = to_asset_id;
  if (amount !== undefined) update.amount = amount;
  if (received_amount !== undefined) update.received_amount = received_amount;
  if (fee !== undefined) update.fee = fee;
  if (currency !== undefined) update.currency = currency;
  if (description !== undefined) update.description = description;

  const { data, error } = await supabase
    .from("transactions")
    .update(update)
    .eq("id", id)
    .select(TRANSACTION_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Undo the old effect on its assets, then apply the new one.
  const revertError = await applyTransaction(old as TxMoneyFields, -1);
  if (revertError) return NextResponse.json({ error: revertError }, { status: 500 });
  const applyError = await applyTransaction(data as unknown as TxMoneyFields, 1);
  if (applyError) return NextResponse.json({ error: applyError }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: old, error: oldError } = await supabase
    .from("transactions")
    .select(MONEY_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 500 });

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (old) {
    const revertError = await applyTransaction(old as TxMoneyFields, -1);
    if (revertError) return NextResponse.json({ error: revertError }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
