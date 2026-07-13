import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { applyTransaction, TRANSACTION_SELECT, type TxMoneyFields } from "@/lib/transactionOps";
import { convert, type Currency } from "@/lib/currency";

// Sells part or all of a holding: reduces its quantity (removing it at zero),
// credits the net proceeds to an asset, and logs the sale as a transfer-style
// transaction. Proceeds are principal, not income, so stats stay honest; only
// the fee counts as spend.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { quantity, price, currency, asset_id, date } = body;
  const fee = body.fee ?? 0;

  if (!quantity || quantity <= 0 || !price || price <= 0) {
    return NextResponse.json({ error: "Quantity and price must be positive" }, { status: 400 });
  }
  if (currency !== "EUR" && currency !== "DKK") {
    return NextResponse.json({ error: "Sale currency must be EUR or DKK" }, { status: 400 });
  }
  if (!asset_id) {
    return NextResponse.json({ error: "An asset to receive the proceeds is required" }, { status: 400 });
  }

  const { data: holding, error: holdingError } = await supabase
    .from("investments")
    .select("id, symbol, quantity, buy_price, buy_currency")
    .eq("id", id)
    .maybeSingle();
  if (holdingError) return NextResponse.json({ error: holdingError.message }, { status: 500 });
  if (!holding) return NextResponse.json({ error: "Holding not found" }, { status: 404 });
  if (quantity > holding.quantity) {
    return NextResponse.json(
      { error: `You hold ${holding.quantity}, can't sell ${quantity}` },
      { status: 400 }
    );
  }

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id, currency")
    .eq("id", asset_id)
    .maybeSingle();
  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 });
  if (!asset) return NextResponse.json({ error: "Target asset not found" }, { status: 400 });

  const gross = quantity * price;
  const received = convert(gross - fee, currency as Currency, asset.currency as Currency);

  let description = `Sold ${quantity} ${holding.symbol} @ ${price} ${currency}`;
  if (holding.buy_price != null && holding.buy_currency === currency) {
    const gainPct = ((price - holding.buy_price) / holding.buy_price) * 100;
    description += ` (${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}% vs cost)`;
  }

  const row = {
    date: date ?? new Date().toISOString().slice(0, 10),
    type: "exchange" as const,
    category_id: null,
    asset_id: null,
    to_asset_id: asset_id,
    amount: gross,
    received_amount: received,
    fee,
    currency,
    description,
  };

  const { data: transaction, error: insertError } = await supabase
    .from("transactions")
    .insert(row)
    .select(TRANSACTION_SELECT)
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const applyError = await applyTransaction(row as TxMoneyFields, 1);
  if (applyError) return NextResponse.json({ error: applyError }, { status: 500 });

  const remaining = holding.quantity - quantity;
  const { error: holdingUpdateError } =
    remaining > 1e-9
      ? await supabase.from("investments").update({ quantity: remaining }).eq("id", id)
      : await supabase.from("investments").delete().eq("id", id);
  if (holdingUpdateError) {
    return NextResponse.json({ error: holdingUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, remaining: Math.max(remaining, 0), transaction });
}
