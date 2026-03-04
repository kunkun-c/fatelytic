-- Add missing RPC function for getting wallet balance for a specific user
-- This function is needed by the useWalletBalance hook for admin/service role access

create or replace function public.get_wallet_balance_for_user(p_user_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select w.balance_credits from public.wallets w where w.user_id = p_user_id), 0);
$$;
