create table assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('cash', 'bank', 'stocks', 'other')),
  current_value numeric not null,
  currency text not null check (currency in ('EUR', 'DKK')),
  updated_at timestamptz not null default now()
);

create table asset_snapshots (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  date date not null,
  value numeric not null
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense'))
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid references categories(id) on delete set null,
  amount numeric not null,
  currency text not null check (currency in ('EUR', 'DKK')),
  description text,
  recurring_id uuid
);

create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null,
  currency text not null check (currency in ('EUR', 'DKK')),
  category_id uuid references categories(id) on delete set null,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_date date not null,
  active boolean not null default true
);

alter table transactions
  add constraint transactions_recurring_id_fkey
  foreign key (recurring_id) references recurring_transactions(id) on delete set null;

create table goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric not null,
  target_date date,
  current_savings numeric not null default 0
);

create index on asset_snapshots (asset_id, date);
create index on transactions (date);
create index on transactions (category_id);
