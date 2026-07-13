import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addDays } from "@/lib/recurrence";
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
    .select("asset_id, date, value, assets(currency)")
    .order("date", { ascending: true });

  if (snapshotsError) {
    return NextResponse.json({ error: snapshotsError.message }, { status: 500 });
  }

  // Group snapshots per asset (already date-ascending from the query).
  type PerAsset = { currency: Currency; snaps: { date: string; value: number }[] };
  const perAsset = new Map<string, PerAsset>();
  for (const snapshot of snapshots) {
    const currency = (snapshot.assets as unknown as { currency: Currency } | null)?.currency;
    if (!currency) continue;
    const entry = perAsset.get(snapshot.asset_id) ?? { currency, snaps: [] };
    entry.snaps.push({ date: snapshot.date, value: snapshot.value });
    perAsset.set(snapshot.asset_id, entry);
  }

  // One point per calendar day from the first snapshot through today. Days
  // without changes carry each asset's last known value forward, so quiet
  // days appear as a flat line instead of a gap.
  const history: ({ date: string } & CurrencyTotals)[] = [];
  const firstDate = snapshots.find(
    (s) => (s.assets as unknown as { currency: Currency } | null)?.currency
  )?.date;

  if (firstDate) {
    const today = new Date().toISOString().slice(0, 10);
    const cursor = new Map<string, number>(); // asset_id -> index of last snapshot <= day

    for (let day = firstDate; day <= today; day = addDays(day, 1)) {
      const totals = emptyTotals();
      for (const [assetId, asset] of perAsset) {
        let i = cursor.get(assetId) ?? -1;
        while (i + 1 < asset.snaps.length && asset.snaps[i + 1].date <= day) i++;
        cursor.set(assetId, i);
        if (i >= 0) totals[asset.currency] += asset.snaps[i].value;
      }
      history.push({ date: day, ...totals });
    }
  }

  return NextResponse.json({ total, history });
}
