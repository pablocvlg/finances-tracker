import { supabase } from "./supabase";
import { convert, type Currency } from "./currency";

export async function upsertTodaySnapshot(assetId: string, value: number): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing, error: selectError } = await supabase
    .from("asset_snapshots")
    .select("id")
    .eq("asset_id", assetId)
    .eq("date", today)
    .maybeSingle();
  if (selectError) return selectError.message;

  const { error } = existing
    ? await supabase.from("asset_snapshots").update({ value }).eq("id", existing.id)
    : await supabase.from("asset_snapshots").insert({ asset_id: assetId, date: today, value });
  return error?.message ?? null;
}

// Applies a signed amount (in the transaction's currency) to an asset's
// current value, converting across EUR/DKK when they differ, and records
// today's snapshot so net worth history follows.
export async function applyToAsset(
  assetId: string,
  amount: number,
  currency: Currency
): Promise<string | null> {
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id, current_value, currency")
    .eq("id", assetId)
    .maybeSingle();
  if (assetError) return assetError.message;
  if (!asset) return null; // asset was deleted; nothing to move

  const newValue = asset.current_value + convert(amount, currency, asset.currency as Currency);
  const { error } = await supabase
    .from("assets")
    .update({ current_value: newValue, updated_at: new Date().toISOString() })
    .eq("id", assetId);
  if (error) return error.message;

  return upsertTodaySnapshot(assetId, newValue);
}
