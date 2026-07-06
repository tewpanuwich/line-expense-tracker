-- Family Expense Tracker — schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) once per project.

create extension if not exists "pgcrypto";

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_icon text,
  pin_hash text,
  is_admin boolean not null default false,
  setup_token text unique,
  setup_token_expires_at timestamptz,
  has_setup boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text
);

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references family_members(id) not null,
  merchant_name text,
  purchase_date date not null,
  total_amount numeric(10,2),
  source text not null default 'manual', -- 'manual' or 'ocr'
  created_at timestamptz not null default now()
);

create table if not exists expense_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid references receipts(id) on delete cascade not null,
  category_id uuid references categories(id),
  item_name text not null,
  amount numeric(10,2) not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_receipts_member_id on receipts(member_id);
create index if not exists idx_receipts_purchase_date on receipts(purchase_date);
create index if not exists idx_expense_items_receipt_id on expense_items(receipt_id);
create index if not exists idx_expense_items_category_id on expense_items(category_id);

-- All access goes through the server using the service role key (custom PIN auth,
-- not Supabase Auth), so RLS is enabled with no policies to block the anon/public
-- keys from ever touching these tables directly.
alter table family_members enable row level security;
alter table categories enable row level security;
alter table receipts enable row level security;
alter table expense_items enable row level security;
