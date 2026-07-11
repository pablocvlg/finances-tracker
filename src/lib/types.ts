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
