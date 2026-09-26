-- Run this once in Supabase SQL Editor.
create table if not exists public.renuka_registrations (
  id uuid primary key default gen_random_uuid(),
  registration_type text not null check (registration_type in ('donation','service')),
  name text not null,
  mobile text not null,
  email text,
  address text,
  city text,
  pin text,
  amount numeric(12,2) not null default 0,
  utr text not null,
  receipt_no text not null,
  payment_method text,
  service_type text,
  service_date date,
  gotra text,
  note text,
  prasad_sent boolean not null default false,
  tracking_no text not null default '',
  created_at timestamptz not null default now(),
  unique (registration_type, utr)
);

create index if not exists renuka_registrations_mobile_idx on public.renuka_registrations (mobile);
create index if not exists renuka_registrations_created_idx on public.renuka_registrations (created_at desc);

alter table public.renuka_registrations enable row level security;

-- Public website: allow only INSERT. No public SELECT/UPDATE/DELETE.
drop policy if exists "public insert registrations" on public.renuka_registrations;
create policy "public insert registrations"
on public.renuka_registrations for insert
to anon, authenticated
with check (true);

-- Temple associates: authenticated users can read/update records.
drop policy if exists "associates read registrations" on public.renuka_registrations;
create policy "associates read registrations"
on public.renuka_registrations for select
to authenticated
using (true);

drop policy if exists "associates update prasad" on public.renuka_registrations;
create policy "associates update prasad"
on public.renuka_registrations for update
to authenticated
using (true)
with check (true);
