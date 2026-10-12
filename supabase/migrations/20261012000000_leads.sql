-- Booking requests from the website. Only the Edge Function (service role) writes here;
-- RLS is on with no policies, so the public anon key cannot read or write the table.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text not null,
  email text not null,
  phone text,
  role text not null check (role in ('forwarder', 'carrier', 'both')),
  trucks_per_month integer,
  message text,
  slots jsonb not null default '[]'::jsonb,
  lang text not null default 'de',
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'confirmed', 'done', 'spam'))
);

alter table public.leads enable row level security;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
