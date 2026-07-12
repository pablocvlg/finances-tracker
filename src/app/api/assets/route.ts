import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("assets")
    .select("id, name, type, current_value, currency, updated_at")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, current_value, currency } = body;

  const { data, error } = await supabase
    .from("assets")
    .insert({ name, type, current_value, currency })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  const { error: snapshotError } = await supabase
    .from("asset_snapshots")
    .insert({ asset_id: data.id, date: today, value: current_value });

  if (snapshotError) return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
