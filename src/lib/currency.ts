export type Currency = "EUR" | "DKK";

export const EUR_TO_DKK = 7.48;

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return from === "EUR" ? amount * EUR_TO_DKK : amount / EUR_TO_DKK;
}

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatCompact(value: number): string {
  const fmt = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 1 });
  if (Math.abs(value) >= 1_000_000) return fmt.format(value / 1_000_000) + "M";
  if (Math.abs(value) >= 1_000) return fmt.format(value / 1_000) + "K";
  return fmt.format(value);
}

// Accepts both "1.234,56" and "1,234.56" style input: when both separators
// appear, the last one is the decimal mark; a lone repeated separator is
// treated as thousands grouping.
export function parseAmount(raw: string): number {
  const s = raw.trim().replace(/\s/g, "");
  if (s === "") return NaN;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  let normalized: string;
  if (lastComma !== -1 && lastDot !== -1) {
    normalized =
      lastComma > lastDot
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    normalized =
      s.indexOf(",") === lastComma ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot !== -1 && s.indexOf(".") !== lastDot) {
    normalized = s.replace(/\./g, "");
  } else {
    normalized = s;
  }
  return parseFloat(normalized);
}

export type CurrencyTotals = { EUR: number; DKK: number };

export function sumInCurrency(totals: CurrencyTotals, display: Currency): number {
  return convert(totals.EUR, "EUR", display) + convert(totals.DKK, "DKK", display);
}
