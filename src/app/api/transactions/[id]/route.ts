import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { applyToAsset } from "@/lib/assetOps";
import type { Currency } from "@/lib/currency";
import type { TransactionType } from "@/lib/types";

const SELECT =
  "id, date, type, category_id, asset_id, amount, currency, description, categories(name), assets(name)";

type MoneyFields = {
  type: TransactionType;
  amount: number;
  currency: Currency;
  asset_id: string | null;
};

// Signed effect a transaction has on its linked asset.
function assetDelta(tx: MoneyFields): number {
  return tx.type === "expense" ? -tx.amount : tx.amount;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, type, category_id, asset_id, amount, currency, description } = body;

  const { data: old, error: oldError } = await supabase
    .from("transactions")
    .select("type, amount, currency, asset_id")
    .eq("id", id)
    .maybeSingle();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 500 });
  if (!old) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (date !== undefined) update.date = date;
  if (type !== undefined) update.type = type;
  if (category_id !== undefined) update.category_id = category_id;
  if (asset_id !== undefined) update.asset_id = asset_id;
  if (amount !== undefined) update.amount = amount;
  if (currency !== undefined) update.currency = currency;
  if (description !== undefined) update.description = description;

  const { data, error } = await supabase
    .from("transactions")
    .update(update)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Undo the old effect on its asset, then apply the new one.
  const oldTx = old as MoneyFields;
  const newTx = data as unknown as MoneyFields;
  if (oldTx.asset_id) {
    const revertError = await applyToAsset(oldTx.asset_id, -assetDelta(oldTx), oldTx.currency);
    if (revertError) return NextResponse.json({ error: revertError }, { status: 500 });
  }
  if (newTx.asset_id) {
    const applyError = await applyToAsset(newTx.asset_id, assetDelta(newTx), newTx.currency);
    if (applyError) return NextResponse.json({ error: applyError }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: old, error: oldError } = await supabase
    .from("transactions")
    .select("type, amount, currency, asset_id")
    .eq("id", id)
    .maybeSingle();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 500 });

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (old?.asset_id) {
    const oldTx = old as MoneyFields;
    const revertError = await applyToAsset(oldTx.asset_id!, -assetDelta(oldTx), oldTx.currency);
    if (revertError) return NextResponse.json({ error: revertError }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
