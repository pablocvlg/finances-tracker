import type { Frequency } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = total % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(Math.min(d, lastDay))}`;
}

export function advanceDate(date: string, frequency: Frequency): string {
  if (frequency === "weekly") return addDays(date, 7);
  if (frequency === "monthly") return addMonths(date, 1);
  return addMonths(date, 12);
}
