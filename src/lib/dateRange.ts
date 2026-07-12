export type RangePreset = "today" | "week" | "month" | "year" | "all" | "custom";

// Far enough back to include any manually entered date.
export const ALL_TIME_START = "1970-01-01";

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
    // Calendar week starting Monday.
    const from = new Date(now);
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    return { from: toDateString(from), to };
  }

  if (preset === "month") return { from: to.slice(0, 7) + "-01", to };

  if (preset === "year") return { from: to.slice(0, 4) + "-01-01", to };

  return { from: ALL_TIME_START, to };
}
