-- ============================================================
-- Kids Piggy (مطمورة الأطفال) - Supabase schema
-- Run this whole file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================

-- 1) Kids
create table if not exists public.kids (
  id         uuid primary key,
  name       text not null,
  avatar     text default '👦',
  theme      text default 'boy',
  goal       numeric default 0,
  stars      integer default 0,
  created_at timestamptz default now()
);

-- 2) Transactions (deposits / withdrawals)
create table if not exists public.transactions (
  id         uuid primary key,
  kid_id     uuid not null references public.kids(id) on delete cascade,
  amount     numeric not null check (amount >= 0),
  type       text not null check (type in ('deposit', 'withdraw')),
  note       text,
  created_at timestamptz default now()
);

create index if not exists transactions_kid_id_idx on public.transactions (kid_id);
create index if not exists transactions_created_at_idx on public.transactions (created_at);

-- 3) Row Level Security
-- The app has no Supabase Auth login (admin is checked in the browser),
-- so the anon key needs read/write access. See the security note below.
alter table public.kids enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "kids_anon_all" on public.kids;
create policy "kids_anon_all" on public.kids
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "transactions_anon_all" on public.transactions;
create policy "transactions_anon_all" on public.transactions
  for all to anon, authenticated
  using (true) with check (true);

-- 4) Realtime (the app subscribes to these tables)
alter table public.kids replica identity full;
alter table public.transactions replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.kids;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- SECURITY NOTE:
-- The policies above let anyone with the anon key read/modify/delete data.
-- That matches how the app works today. To lock it down later, enable
-- Supabase Auth for the admin and restrict writes to authenticated admins.
-- ============================================================
