import type { Currency } from "./currency";

export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  parent_id: string | null;
};

export type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  category_id: string | null;
  amount: number;
  currency: Currency;
  description: string | null;
  categories: { name: string } | null;
};

export type Frequency = "weekly" | "monthly" | "yearly";

export type RecurringTransaction = {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  category_id: string | null;
  frequency: Frequency;
  next_date: string;
  active: boolean;
  categories: { name: string; type: TransactionType } | null;
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
