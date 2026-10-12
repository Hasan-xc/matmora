-- ============================================================
-- Kids Piggy - Migration: multiple jars per kid
-- Run in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run. Existing data is kept (moved into each kid's first jar).
-- ============================================================

-- 1) Jars table
create table if not exists public.jars (
  id         uuid primary key,
  kid_id     uuid not null references public.kids(id) on delete cascade,
  name       text not null default 'مطمورة',
  status     text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz default now(),
  closed_at  timestamptz
);

-- A kid can have only one open jar at a time
create unique index if not exists jars_one_active_per_kid
  on public.jars (kid_id) where status = 'active';
create index if not exists jars_kid_id_idx on public.jars (kid_id);

-- 2) Link transactions to a jar
alter table public.transactions
  add column if not exists jar_id uuid references public.jars(id) on delete cascade;
create index if not exists transactions_jar_id_idx on public.transactions (jar_id);

-- 3) Backfill: give every existing kid one open jar
insert into public.jars (id, kid_id, name, status)
select gen_random_uuid(), k.id, 'مطمورة 1', 'active'
from public.kids k
where not exists (select 1 from public.jars j where j.kid_id = k.id);

-- 4) Backfill: attach existing transactions to the kid's open jar
update public.transactions t
set jar_id = j.id
from public.jars j
where j.kid_id = t.kid_id
  and j.status = 'active'
  and t.jar_id is null;

-- 5) Row Level Security (same open policy as the other tables)
alter table public.jars enable row level security;

drop policy if exists "jars_anon_all" on public.jars;
create policy "jars_anon_all" on public.jars
  for all to anon, authenticated
  using (true) with check (true);

-- 6) Realtime
alter table public.jars replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.jars;
exception when duplicate_object then null;
end $$;
