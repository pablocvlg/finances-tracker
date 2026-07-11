export type RangePreset = "today" | "week" | "month" | "custom";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolveRange(
  preset: RangePreset,
  custom?: { from: string; to: string }
): { from: string; to: string } {
  if (preset === "custom" && custom) return custom;

  const now = new Date();
  const to = toDateString(now);

  if (preset === "today") return { from: to, to };

  if (preset === "week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { from: toDateString(from), to };
  }

  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  return { from: toDateString(from), to };
}
