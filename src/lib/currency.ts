export type Currency = "EUR" | "DKK";

export const EUR_TO_DKK = 7.48;

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return from === "EUR" ? amount * EUR_TO_DKK : amount / EUR_TO_DKK;
}

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "EUR" ? "en-IE" : "da-DK", {
    style: "currency",
    currency,
  }).format(amount);
}

export type CurrencyTotals = { EUR: number; DKK: number };

export function sumInCurrency(totals: CurrencyTotals, display: Currency): number {
  return convert(totals.EUR, "EUR", display) + convert(totals.DKK, "DKK", display);
}
