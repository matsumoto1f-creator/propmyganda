create table if not exists public.addon_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid references public.onboarding_orders(id) on delete set null,
  artist_name text not null,
  email text not null,
  items jsonb not null,
  total_cents integer not null check (total_cents > 0),
  notes text,
  status text not null default 'pending' check (status in ('pending','paid','done','cancelled')),
  stripe_session_id text,
  stripe_payment_intent text,
  paid_at timestamptz
);
revoke all on public.addon_orders from anon;
grant select, update on public.addon_orders to authenticated;
grant all on public.addon_orders to service_role;
alter table public.addon_orders enable row level security;
create index if not exists addon_orders_created on public.addon_orders (created_at desc);
drop policy if exists "staff read addon orders" on public.addon_orders;
create policy "staff read addon orders" on public.addon_orders for select to authenticated using (public.my_crm_role() IS NOT NULL);
drop policy if exists "staff update addon orders" on public.addon_orders;
create policy "staff update addon orders" on public.addon_orders for update to authenticated using (public.my_crm_role() IS NOT NULL) with check (public.my_crm_role() IS NOT NULL);