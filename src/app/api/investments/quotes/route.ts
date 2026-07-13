import { NextRequest, NextResponse } from "next/server";
import { EUR_TO_DKK } from "@/lib/currency";

type RawQuote = {
  symbol: string;
  price: number | null;
  currency: string | null;
  prevClose: number | null;
  error?: string;
};

async function fetchQuote(symbol: string): Promise<RawQuote> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) {
      return { symbol, price: null, currency: null, prevClose: null, error: `HTTP ${res.status}` };
    }
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) {
      return { symbol, price: null, currency: null, prevClose: null, error: "symbol not found" };
    }
    return {
      symbol,
      price: meta.regularMarketPrice,
      currency: meta.currency ?? null,
      prevClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
    };
  } catch (e) {
    return { symbol, price: null, currency: null, prevClose: null, error: String(e) };
  }
}

// Rate from `currency` into EUR. EUR/DKK use the app's fixed peg; anything
// else (USD, GBP, …) comes from the ECB via frankfurter.dev.
async function rateToEUR(currency: string): Promise<number | null> {
  if (currency === "EUR") return 1;
  if (currency === "DKK") return 1 / EUR_TO_DKK;
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(currency)}&symbols=EUR`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.rates?.EUR ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const symbols = (request.nextUrl.searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  const quotes = await Promise.all(symbols.map(fetchQuote));

  const currencies = [...new Set(quotes.filter((q) => q.price != null && q.currency).map((q) => q.currency!))];
  const rates = new Map<string, number | null>();
  await Promise.all(
    currencies.map(async (currency) => {
      rates.set(currency, await rateToEUR(currency));
    })
  );

  const result = quotes.map((q) => {
    const rate = q.currency ? (rates.get(q.currency) ?? null) : null;
    return { ...q, priceEUR: q.price != null && rate != null ? q.price * rate : null };
  });

  return NextResponse.json(result);
}
