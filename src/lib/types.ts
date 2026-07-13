import type { Currency } from "./currency";

export type TransactionType = "income" | "expense";

// Transactions can additionally move money between two assets.
export type TransactionKind = TransactionType | "exchange";

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  parent_id: string | null;
};

export type Transaction = {
  id: string;
  date: string;
  type: TransactionKind;
  category_id: string | null;
  asset_id: string | null;
  to_asset_id: string | null;
  amount: number;
  received_amount: number | null;
  fee: number;
  currency: Currency;
  description: string | null;
  categories: { name: string } | null;
  assets: { name: string } | null;
  to_assets: { name: string } | null;
};

export type Frequency = "weekly" | "monthly" | "yearly";

export type RecurringTransaction = {
  id: string;
  name: string;
  amount: number;
  fee: number;
  currency: Currency;
  category_id: string | null;
  asset_id: string | null;
  frequency: Frequency;
  next_date: string;
  active: boolean;
  categories: { name: string; type: TransactionType } | null;
  assets: { name: string } | null;
};

export type AssetType = "cash" | "bank" | "stocks" | "other";

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  current_value: number;
  currency: Currency;
  updated_at: string;
};

export type Investment = {
  id: string;
  symbol: string;
  name: string | null;
  quantity: number;
  buy_price: number | null;
  buy_currency: "EUR" | "DKK" | "USD" | null;
  created_at: string;
};

export type Quote = {
  symbol: string;
  price: number | null;
  currency: string | null;
  prevClose: number | null;
  priceEUR: number | null;
  error?: string;
};
