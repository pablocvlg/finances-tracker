import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, type, current_value, currency } = body;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) update.name = name;
  if (type !== undefined) update.type = type;
  if (current_value !== undefined) update.current_value = current_value;
  if (currency !== undefined) update.currency = currency;

  const { data, error } = await supabase
    .from("assets")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the history in sync: a value change writes (or overwrites) today's snapshot.
  if (current_value !== undefined) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("asset_snapshots")
      .select("id")
      .eq("asset_id", id)
      .eq("date", today)
      .maybeSingle();

    const snapshotError = existing
      ? (await supabase.from("asset_snapshots").update({ value: current_value }).eq("id", existing.id)).error
      : (await supabase.from("asset_snapshots").insert({ asset_id: id, date: today, value: current_value })).error;

    if (snapshotError) return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("assets").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
