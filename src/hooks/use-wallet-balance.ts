import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useWalletBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  type WalletRow = { balance_credits?: unknown } | null;
  type SingleResult = { data: WalletRow; error: unknown };
  type WalletQuery = {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<SingleResult>;
      };
    };
  };
  type SupabaseFrom = { from: (table: string) => WalletQuery };

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setBalance(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as unknown as SupabaseFrom)
        .from("wallets")
        .select("balance_credits")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setBalance(0);
        return;
      }

      const raw = data?.balance_credits;
      const next = typeof raw === "number" ? raw : Number(raw ?? 0);
      setBalance(Number.isFinite(next) ? next : 0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, loading, refresh };
}
