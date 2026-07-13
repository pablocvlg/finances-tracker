import { applyToAsset } from "./assetOps";
import type { Currency } from "./currency";

export const TRANSACTION_SELECT =
  "id, date, type, category_id, asset_id, to_asset_id, amount, received_amount, fee, currency, description, categories(name), assets:assets!transactions_asset_id_fkey(name), to_assets:assets!transactions_to_asset_id_fkey(name)";

export type TxMoneyFields = {
  type: "income" | "expense" | "exchange";
  amount: number;
  fee: number;
  received_amount: number | null;
  currency: Currency;
  asset_id: string | null;
  to_asset_id: string | null;
};

// Applies (direction=1) or reverts (direction=-1) a transaction's effect on
// its linked assets: expenses cost amount+fee, incomes net amount-fee, and
// exchanges move amount+fee out of the source and the received amount (or the
// fixed-rate conversion of amount) into the target.
export async function applyTransaction(
  tx: TxMoneyFields,
  direction: 1 | -1
): Promise<string | null> {
  if (tx.type === "exchange") {
    if (tx.asset_id) {
      const error = await applyToAsset(tx.asset_id, direction * -(tx.amount + tx.fee), tx.currency);
      if (error) return error;
    }
    if (tx.to_asset_id) {
      // received_amount is in the target asset's own currency.
      const error =
        tx.received_amount != null
          ? await applyToAsset(tx.to_asset_id, direction * tx.received_amount, null)
          : await applyToAsset(tx.to_asset_id, direction * tx.amount, tx.currency);
      if (error) return error;
    }
    return null;
  }

  if (!tx.asset_id) return null;
  const net = tx.type === "expense" ? -(tx.amount + tx.fee) : tx.amount - tx.fee;
  return applyToAsset(tx.asset_id, direction * net, tx.currency);
}
