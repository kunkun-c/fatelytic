-- Wallet / Credits / Top-up orders / SePay webhook events

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_credits bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_credits bigint not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);

create table if not exists public.topup_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'sepay',
  amount_vnd integer not null,
  credits integer not null,
  status text not null check (status in ('pending','paid','expired','canceled')),
  order_code text not null,
  qr_url text,
  qr_payload jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expired_at timestamptz
);

create unique index if not exists topup_orders_order_code_key on public.topup_orders(order_code);
create index if not exists topup_orders_user_created_idx on public.topup_orders(user_id, created_at desc);
create index if not exists topup_orders_status_created_idx on public.topup_orders(status, created_at desc);

create table if not exists public.sepay_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed boolean not null default false,
  processed_at timestamptz,
  error text
);

create unique index if not exists sepay_webhook_events_event_id_key on public.sepay_webhook_events(event_id);

alter table public.wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.topup_orders enable row level security;
alter table public.sepay_webhook_events enable row level security;

-- RLS policies

create policy "wallets_select_own"
on public.wallets
for select
to authenticated
using (auth.uid() = user_id);

create policy "credit_ledger_select_own"
on public.credit_ledger
for select
to authenticated
using (auth.uid() = user_id);

create policy "topup_orders_select_own"
on public.topup_orders
for select
to authenticated
using (auth.uid() = user_id);

create policy "topup_orders_insert_own"
on public.topup_orders
for insert
to authenticated
with check (auth.uid() = user_id);

-- Prevent client from updating status/paid_at etc. (no update policy)

-- No client access to webhook events

-- RPC helpers

create or replace function public.get_wallet_balance()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select w.balance_credits from public.wallets w where w.user_id = auth.uid()), 0);
$$;

create or replace function public.grant_credits(
  p_user_id uuid,
  p_credits bigint,
  p_reason text,
  p_ref_type text default null,
  p_ref_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance bigint;
  v_role text;
begin
  v_role := current_setting('request.jwt.claim.role', true);
  if v_role is distinct from 'service_role' then
    raise exception 'grant_credits requires service_role';
  end if;

  insert into public.wallets(user_id, balance_credits)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update public.wallets
  set balance_credits = balance_credits + p_credits,
      updated_at = now()
  where user_id = p_user_id
  returning balance_credits into v_new_balance;

  insert into public.credit_ledger(user_id, delta_credits, reason, ref_type, ref_id)
  values (p_user_id, p_credits, p_reason, p_ref_type, p_ref_id);

  return v_new_balance;
end;
$$;

create or replace function public.spend_credits(
  p_user_id uuid,
  p_cost bigint,
  p_reason text,
  p_ref_type text default null,
  p_ref_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
  v_new_balance bigint;
  v_role text;
  v_auth_uid uuid;
begin
  v_role := current_setting('request.jwt.claim.role', true);
  v_auth_uid := auth.uid();

  if v_role is distinct from 'service_role' then
    if v_auth_uid is null or v_auth_uid <> p_user_id then
      raise exception 'spend_credits not allowed';
    end if;
  end if;

  insert into public.wallets(user_id, balance_credits)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select balance_credits into v_balance
  from public.wallets
  where user_id = p_user_id
  for update;

  if coalesce(v_balance, 0) < p_cost then
    raise exception 'insufficient_credits';
  end if;

  update public.wallets
  set balance_credits = balance_credits - p_cost,
      updated_at = now()
  where user_id = p_user_id
  returning balance_credits into v_new_balance;

  insert into public.credit_ledger(user_id, delta_credits, reason, ref_type, ref_id)
  values (p_user_id, -p_cost, p_reason, p_ref_type, p_ref_id);

  return v_new_balance;
end;
$$;

-- Create wallet for new users with trial credits

create or replace function public.handle_new_user_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets(user_id, balance_credits)
  values (new.id, 5)
  on conflict (user_id) do nothing;

  insert into public.credit_ledger(user_id, delta_credits, reason, ref_type, ref_id)
  values (new.id, 5, 'trial_signup', 'auth.users', new.id::text);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_wallet on auth.users;
create trigger on_auth_user_created_wallet
after insert on auth.users
for each row execute procedure public.handle_new_user_wallet();
