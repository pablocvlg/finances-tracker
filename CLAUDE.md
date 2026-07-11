# Finance Tracker — Project Spec

## What this is

A personal finance app to track net worth, expenses, and income, with a
savings simulator and a trends view. Single-user, no login or account system.
Open access to anyone with the link — there's no card or bank credential
data, just amounts and categories, so there's no need to lock down access.

## Stack

- Next.js (App Router) + React
- Supabase (Postgres) as the database
- Recharts for charts
- Vercel for deployment

## Security

None. No password middleware, no authentication, no restrictive RLS. The
project is public to anyone with the URL. There's no sensitive banking data,
just transactions and asset values.

## Currencies

The app handles two currencies: EUR and DKK (Danish krone). The krone is
pegged to the euro (ERM II), so a fixed exchange rate is used instead of
querying an external API:

```
1 EUR = 7.48 DKK
```

This value is stored as a constant in code (e.g. `lib/currency.ts`), not in
the database, since it doesn't change. All screens (Home, Transactions,
Simulator, Trends) should:

- Allow entering an amount in EUR or DKK when creating a transaction or asset
  (currency selector in the form).
- Store both the amount and the original currency entered in
  `transactions`/`assets` (a `currency` column), without forcing a conversion
  on save.
- Show totals and aggregates (net worth, monthly expenses, etc.) in whichever
  currency the user chooses to view, converting on the fly with the fixed
  rate — never recalculating or overwriting the original stored value.
- A simple toggle on the dashboard/home to switch the display currency
  (EUR ⇄ DKK) that affects all totals shown.

## Data model (Supabase)

```sql
assets
  id, name, type (cash/bank/stocks/other), current_value, currency, updated_at

asset_snapshots
  id, asset_id, date, value        -- net worth history for trend charts

categories
  id, name, type (income/expense)  -- user-managed categories, not hardcoded

transactions
  id, date, type (income/expense), category_id, amount, currency, description, recurring_id (nullable)

recurring_transactions
  id, name, amount, category_id, frequency (monthly/weekly/yearly), next_date, active

goals
  id, name, target_amount, target_date, current_savings
```

Notes:
- `categories` is its own table (not a fixed enum) because the user wants to
  categorize both expenses AND income with categories he manages himself
  (create, edit, delete).
- `asset_snapshots` is needed to chart net worth evolution over time, not
  just the current value.

## Screens

### 1. Home / Dashboard

This is the main screen, showing:
- Total net worth (sum of `assets.current_value`), with an evolution chart
  using `asset_snapshots`.
- Daily, weekly, and monthly spend (aggregations over `transactions` filtered
  by type=expense).
- Income for the period (same logic, type=income).
- Breakdown by category (pie or bar chart) for both expenses and income.
- All of it with a date range selector (today / week / month / custom).

### 2. Transactions

- Transaction list with filters by category, type, date.
- Manual transaction entry (date, type, category, amount, description).
- `recurring_transactions` management: create scheduled expenses/income that
  automatically generate a transaction on the corresponding date.
- `categories` management: create/edit/delete income and expense categories.

### 3. Simulator

Two modes, either on the same screen or via a toggle:
- **Goal → required savings**: user enters a target amount + deadline →
  calculates how much they need to save per month to get there.
- **Current trend → when will I get there**: uses the real savings rate
  (average of income minus expenses over the last N months, calculated from
  `transactions`) and projects the date a target amount will be reached.

### 4. Trends

A separate screen (not part of home) focused on historical evolution:
- Total net worth evolution over time (line chart, using `asset_snapshots`).
- Monthly spend evolution by category across several months (to see if a
  category is growing or shrinking over time).
- Month-by-month income vs. expenses comparison.

Difference from home: home shows the current state and short-term aggregates
(day/week/month); Trends shows medium/long-term evolution.

## Suggested implementation plan (by phase)

1. Next.js project scaffolding + Supabase connection, no auth.
2. SQL migrations for the tables above.
3. Home screen with mock/sample data before wiring everything up.
4. Transactions + Categories CRUD.
5. Recurring transactions (scheduled).
6. Net worth (assets + snapshots).
7. Simulator.
8. Trends.

## Conventions

- Components in Spanish or English, pick one and stay consistent throughout
  the whole project.
- All Supabase queries go through Next.js API routes (no direct client-to-
  Supabase calls), even without auth, to keep aggregation logic (weekly,
  monthly spend, etc.) centralized on the server.

## Frontend design guidelines

Avoid the typical generic "AI-generated" look. Specifically:

- Don't mix italics with regular text as a styling device (e.g. italicizing
  random words or phrases for emphasis). Use weight, size, or color instead
  if emphasis is needed, and use it sparingly.
- Don't over-highlight text with background colors, bold, or colored spans
  scattered through paragraphs. Reserve emphasis for genuinely important
  numbers (e.g. the total net worth figure), not general copy.
- Don't prefix every heading or section title with an emoji or icon tag
  (e.g. "💰 Net Worth", "📊 Trends"). Headings should be plain text; icons,
  if used at all, go in the UI as functional elements (nav items, buttons),
  not as decoration bolted onto every title.
- Avoid the default "AI dashboard" aesthetic: rounded gradient cards with
  drop shadows on everything, purple/blue gradients as a crutch, and
  every metric wrapped in its own bordered box. Prefer a cleaner, denser
  layout with clear typographic hierarchy over decorative containers.
- Don't pad copy with filler adjectives or exclamation marks in UI text
  ("Great job saving this month!"). Keep labels and messages factual and
  short.
- When in doubt, favor restraint: fewer colors, fewer borders, fewer boxes,
  more whitespace and typographic hierarchy to organize information.