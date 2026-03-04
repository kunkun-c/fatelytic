import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type WalletRow = { balance_credits?: unknown } | null;

type WalletSingleResult = { data: WalletRow; error: unknown };
type WalletQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<WalletSingleResult>;
    };
  };
};
type SupabaseFrom = { from: (table: string) => WalletQuery };

async function fetchWalletBalance(userId: string): Promise<number> {
  // RPC that accepts explicit user_id (security definer) to avoid auth.uid() context issues.
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  }).rpc("get_wallet_balance_for_user", { p_user_id: userId });

  if (error) throw error;
  const n = typeof data === "number" ? data : Number(data ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function useWalletBalance() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const userId = user?.id ?? null;
  const queryKey = useMemo(() => ["wallet-balance", userId] as const, [userId]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return 0;
      return fetchWalletBalance(userId);
    },
    enabled: !!userId,
    // Cache-first, but never get stuck on placeholder values.
    // If persisted cache exists, React Query will hydrate it. If not, we fetch once.
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  const refresh = useCallback(async () => {
    if (!userId) return;
    await qc.invalidateQueries({ queryKey });
  }, [qc, queryKey, userId]);

  const updateBalance = useCallback(
    (delta: number) => {
      if (!userId) return;
      qc.setQueryData<number>(queryKey, (prev) => {
        const base = typeof prev === "number" && Number.isFinite(prev) ? prev : 0;
        return Math.max(0, base + delta);
      });
    },
    [qc, queryKey, userId]
  );

  useEffect(() => {
    const handler = () => void refresh();
    window.addEventListener("wallet-refresh-needed", handler);
    return () => window.removeEventListener("wallet-refresh-needed", handler);
  }, [refresh]);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const delta = (event as CustomEvent<{ delta?: unknown }>).detail?.delta;
      if (typeof delta === "number") updateBalance(delta);
    };

    window.addEventListener("credit-spent", handler as EventListener);
    return () => window.removeEventListener("credit-spent", handler as EventListener);
  }, [updateBalance]);

  return {
    balance: typeof query.data === "number" ? query.data : 0,
    loading: !!userId && query.isLoading,
    refresh,
    updateBalance,
  };
}
