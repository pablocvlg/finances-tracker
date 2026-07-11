import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Currency, CurrencyTotals } from "@/lib/currency";

function emptyTotals(): CurrencyTotals {
  return { EUR: 0, DKK: 0 };
}

export async function GET() {
  const { data: assets, error: assetsError } = await supabase
    .from("assets")
    .select("current_value, currency");

  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  const total = emptyTotals();
  for (const asset of assets) {
    total[asset.currency as Currency] += asset.current_value;
  }

  const { data: snapshots, error: snapshotsError } = await supabase
    .from("asset_snapshots")
    .select("date, value, assets(currency)")
    .order("date", { ascending: true });

  if (snapshotsError) {
    return NextResponse.json({ error: snapshotsError.message }, { status: 500 });
  }

  const byDate = new Map<string, CurrencyTotals>();
  for (const snapshot of snapshots) {
    const currency = (snapshot.assets as unknown as { currency: Currency } | null)?.currency;
    if (!currency) continue;
    const bucket = byDate.get(snapshot.date) ?? emptyTotals();
    bucket[currency] += snapshot.value;
    byDate.set(snapshot.date, bucket);
  }

  const history = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, ...totals }));

  return NextResponse.json({ total, history });
}
