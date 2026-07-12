alter table transactions
  add column asset_id uuid references assets(id) on delete set null;

alter table recurring_transactions
  add column asset_id uuid references assets(id) on delete set null;

create index on transactions (asset_id);
