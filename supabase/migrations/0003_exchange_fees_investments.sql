-- Exchange transactions: money moving between two assets, possibly across currencies.
alter table transactions drop constraint transactions_type_check;
alter table transactions
  add constraint transactions_type_check check (type in ('income', 'expense', 'exchange'));

alter table transactions
  add column to_asset_id uuid references assets(id) on delete set null;

-- Amount credited to the target asset, in the target asset's currency.
-- Null means convert the sent amount at the fixed EUR/DKK rate.
alter table transactions
  add column received_amount numeric;

-- Fees, in the transaction's currency. Charged on top of expenses/exchanges,
-- deducted from incomes.
alter table transactions
  add column fee numeric not null default 0;

alter table recurring_transactions
  add column fee numeric not null default 0;

-- Investment holdings (stocks/ETFs), valued live from market data.
create table investments (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text,
  quantity numeric not null,
  buy_price numeric,
  buy_currency text check (buy_currency in ('EUR', 'DKK', 'USD')),
  created_at timestamptz not null default now()
);
