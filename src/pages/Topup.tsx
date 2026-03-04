import { useCallback, useEffect, useMemo, useRef, useState, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { TOPUP_PACKAGES, type TopupPackageOption } from "../../supabase/functions/_shared/credits";

type PackageOption = TopupPackageOption;

type OrderRow = {
  id: string;
  order_code: string;
  amount_vnd: number;
  credits: number;
  status: "pending" | "paid" | "expired" | "canceled";
  qr_url: string | null;
  created_at: string;
};

const ACTIVE_ORDER_STORAGE_KEY = "fatelytic:topup:active-order";

type PersistedActiveOrder = {
  userId: string;
  order: OrderRow;
};

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// Reducer for managing topup state
type TopupState = {
  creating: boolean;
  creatingAmountVnd: number | null;
  activeOrder: OrderRow | null;
  pendingPkg: PackageOption | null;
  polling: boolean;
  downloading: boolean;
};

type TopupAction = 
  | { type: 'SET_CREATING'; payload: boolean }
  | { type: 'SET_CREATING_AMOUNT'; payload: number | null }
  | { type: 'SET_ACTIVE_ORDER'; payload: OrderRow | null }
  | { type: 'SET_PENDING_PKG'; payload: PackageOption | null }
  | { type: 'SET_POLLING'; payload: boolean }
  | { type: 'SET_DOWNLOADING'; payload: boolean }
  | { type: 'RESET_STATE' };

const topupReducer = (state: TopupState, action: TopupAction): TopupState => {
  switch (action.type) {
    case 'SET_CREATING':
      return { ...state, creating: action.payload };
    case 'SET_CREATING_AMOUNT':
      return { ...state, creatingAmountVnd: action.payload };
    case 'SET_ACTIVE_ORDER':
      return { ...state, activeOrder: action.payload };
    case 'SET_PENDING_PKG':
      return { ...state, pendingPkg: action.payload };
    case 'SET_POLLING':
      return { ...state, polling: action.payload };
    case 'SET_DOWNLOADING':
      return { ...state, downloading: action.payload };
    case 'RESET_STATE':
      return {
        creating: false,
        creatingAmountVnd: null,
        activeOrder: null,
        pendingPkg: null,
        polling: false,
        downloading: false,
      };
    default:
      return state;
  }
};

export default function Topup() {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  
  const [state, dispatch] = useReducer(topupReducer, {
    creating: false,
    creatingAmountVnd: null,
    activeOrder: null,
    pendingPkg: null,
    polling: false,
    downloading: false,
  });
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<OrderRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const pollIntervalRef = useRef<number | null>(null);
  const pollInFlightRef = useRef(false);

  const persistActiveOrder = useCallback(
    (order: OrderRow | null) => {
      const userId = session?.user?.id;
      if (!userId) return;
      if (!order) {
        window.localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
        return;
      }
      const payload: PersistedActiveOrder = { userId, order };
      window.localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(payload));
    },
    [session?.user?.id]
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    dispatch({ type: 'SET_POLLING', payload: false });
    pollInFlightRef.current = false; // Reset in-flight flag
  }, []);

  // Manual close function for popup
  const closePopup = useCallback(() => {
    stopPolling();
    dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
    persistActiveOrder(null);
  }, [persistActiveOrder, stopPolling]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const persisted = safeParseJson<PersistedActiveOrder>(window.localStorage.getItem(ACTIVE_ORDER_STORAGE_KEY));
    if (!persisted) return;
    if (persisted.userId !== userId) return;

    dispatch({ type: 'SET_ACTIVE_ORDER', payload: persisted.order });
  }, [session?.user?.id]);

  const packages = useMemo<PackageOption[]>(() => TOPUP_PACKAGES, []);

  const formatVnd = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

  const fetchOrder = useCallback(async (orderId: string) => {
    const { data, error } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> } };
      };
    })
      .from("topup_orders")
      .select("id, order_code, amount_vnd, credits, status, qr_url, created_at")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) return null;
    return data as OrderRow;
  }, []);

  const startPolling = useCallback(
    (orderId: string) => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      dispatch({ type: 'SET_POLLING', payload: true });
      
      let retryCount = 0;
      const maxRetries = 90; // 90 * 4 seconds = 6 minutes max
      
      pollIntervalRef.current = window.setInterval(async () => {
        if (pollInFlightRef.current) return;
        pollInFlightRef.current = true;
        
        retryCount++;
        if (retryCount > maxRetries) {
          console.log('Max polling retries reached, stopping');
          stopPolling();
          toast.error(t("topup.toast.expired"));
          dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
          persistActiveOrder(null);
          return;
        }
        
        try {
          const next = await fetchOrder(orderId);
          if (!next) return;
          
          // Only update state if status changed to reduce UI updates
          if (next.status !== state.activeOrder?.status) {
            dispatch({ type: 'SET_ACTIVE_ORDER', payload: next });
            
            if (next.status === "paid") {
              if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              dispatch({ type: 'SET_POLLING', payload: false });
              
              toast.success(t("topup.toast.success"));
              
              // Optimistically update local cached balance immediately.
              const delta = Number(next.credits ?? 0);
              if (Number.isFinite(delta) && delta > 0) {
                window.dispatchEvent(new CustomEvent("credit-spent", { detail: { delta } }));
              }
              
              // Trigger wallet balance refresh across the app
              window.dispatchEvent(new CustomEvent('wallet-refresh-needed'));
              
              // Auto-close popup after successful payment
              setTimeout(() => {
                dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
                persistActiveOrder(null);
              }, 2000);
              
            } else if (next.status === "expired" || next.status === "canceled") {
              if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              dispatch({ type: 'SET_POLLING', payload: false });
              toast.error(next.status === "expired" ? t("topup.toast.expired") : t("topup.toast.canceled"));
              persistActiveOrder(next);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        } finally {
          pollInFlightRef.current = false;
        }
      }, 4000);

      return () => {
        if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      };
    },
    [fetchOrder, persistActiveOrder, stopPolling, state.activeOrder?.status, t]
  );

  const loadOrderHistory = useCallback(async () => {
    if (!session?.user) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => { 
            eq: (col: string, val: string) => {
              order: (col: string, options: { ascending: boolean }) => ({
                limit: (n: number) => Promise<{ data: unknown; error: unknown }>
              })
            }
          };
        };
      })
        .from('topup_orders')
        .select('id, order_code, amount_vnd, credits, status, qr_url, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error loading order history:', error);
        toast.error(t("topup.toast.historyFailed"));
        return;
      }
      
      setHistoryOrders((data as OrderRow[]) || []);
    } catch (err) {
      console.error('Error loading order history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [session?.user, t]);

  const downloadQr = useCallback(async () => {
    const url = state.activeOrder?.qr_url;
    if (!url) return;
    dispatch({ type: 'SET_DOWNLOADING', payload: true });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("download_failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `QR-${state.activeOrder?.order_code ?? "topup"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error(e);
      toast.error(t("topup.toast.downloadFailed"));
    } finally {
      dispatch({ type: 'SET_DOWNLOADING', payload: false });
    }
  }, [state.activeOrder?.order_code, state.activeOrder?.qr_url, t]);

  const createOrder = useCallback(
    async (pkg: PackageOption) => {
      dispatch({ type: 'SET_CREATING', payload: true });
      dispatch({ type: 'SET_CREATING_AMOUNT', payload: pkg.amountVnd });
      dispatch({ type: 'SET_PENDING_PKG', payload: pkg });

      // Open modal immediately with a placeholder order for instant UX.
      const placeholderOrder: OrderRow = {
        id: "__creating__",
        order_code: "",
        amount_vnd: pkg.amountVnd,
        credits: pkg.credits,
        status: "pending",
        qr_url: null,
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'SET_ACTIVE_ORDER', payload: placeholderOrder });
      try {
        // Ensure we have a valid session
        let s = session ?? null;
        if (!s) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error("Session refresh error:", refreshError);
            toast.error(t("topup.toast.sessionExpired"));
            setTimeout(() => {
              window.location.href = "/auth";
            }, 2000);
            return;
          }
          s = refreshData.session ?? null;
        }

        // Always get a fresh session to ensure token is valid
        if (!s) {
          const { data: sessionData } = await supabase.auth.getSession();
          s = sessionData.session;
        }

        if (!s) {
          toast.error(t("topup.toast.signInRequired"));
          setTimeout(() => {
            window.location.href = "/auth";
          }, 2000);
          return;
        }

        const accessToken = s.access_token;
        if (!accessToken) {
          toast.error(t("topup.toast.signInRequired"));
          setTimeout(() => {
            window.location.href = "/auth";
          }, 2000);
          return;
        }

        const { data, error } = await supabase.functions.invoke("create-topup-order", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: { amountVnd: pkg.amountVnd, credits: pkg.credits },
        });

        if (error) {
          console.error("Order creation failed:", error);
          throw error;
        }

        const json = data as { order?: OrderRow };
        if (!json?.order) throw new Error("Invalid response");

        dispatch({ type: 'SET_ACTIVE_ORDER', payload: json.order });
        persistActiveOrder(json.order);
      } catch (err) {
        console.error("Create order error:", err);
        toast.error(t("topup.toast.createFailed"));
        dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
        persistActiveOrder(null);
      } finally {
        dispatch({ type: 'SET_CREATING', payload: false });
        dispatch({ type: 'SET_CREATING_AMOUNT', payload: null });
        dispatch({ type: 'SET_PENDING_PKG', payload: null });
      }
    },
    [persistActiveOrder, session, t]
  );

  // Remove auto-check for existing orders - user should choose package first

  // Start polling when there's a pending order (includes restored order)
  useEffect(() => {
    if (!state.activeOrder?.id) return;
    if (state.activeOrder.id === "__creating__") return;
    if (state.activeOrder.status !== "pending") return;
    
    // Prevent duplicate intervals and polling on page reload
    if (pollIntervalRef.current) return;
    if (state.polling) return; // Already polling
    
    const stop = startPolling(state.activeOrder.id);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeOrder?.id, state.activeOrder?.status, state.activeOrder?.created_at]); // startPolling excluded to prevent infinite loops

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("topup.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("topup.subtitle")}</p>
      </div>

      {state.activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold">{t("topup.modal.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("topup.modal.transferHint", {
                  amount: formatVnd(state.activeOrder.amount_vnd),
                  code: state.activeOrder.order_code,
                })}
              </p>
            </div>
            
            
            <div className="relative mb-4 flex justify-center">
              <div className="text-center">
                {state.activeOrder?.qr_url ? (
                  <img
                    src={state.activeOrder.qr_url}
                    alt={t("topup.modal.qrAlt")}
                    className="h-64 w-64 rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="h-64 w-64 rounded-lg border bg-muted/40 shadow-sm">
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-foreground/40 border-t-transparent" />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void downloadQr()}
                  disabled={state.downloading || !state.activeOrder?.qr_url}
                  className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline disabled:opacity-60"
                >
                  {state.downloading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : null}
                  {t("topup.modal.downloadQr")}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>{t("topup.modal.autoCredit")}</p>
              {state.activeOrder.status === "pending" && state.polling && (
                <p className="text-xs">
                  {t("topup.modal.checking")}
                </p>
              )}
            </div>
            
            <button
              onClick={closePopup}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg px-3 py-2 text-sm hover:bg-accent"
            >
              {state.polling && state.activeOrder.status === "pending" ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              {state.polling && state.activeOrder.status === "pending" ? t("topup.modal.checkingBtn") : t("topup.modal.close")}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {packages.map((p) => (
          <div key={p.amountVnd} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-foreground">{lang === "vi" ? p.titleVi : `${p.credits} credits`}</div>
                <div className="mt-1 text-sm text-muted-foreground">{lang === "vi" ? p.taglineVi : ""}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">{formatVnd(p.amountVnd)}</div>
                <div className="text-xs text-muted-foreground">{p.credits} credit</div>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {p.benefitsVi.map((b) => (
                <div key={b}>- {b}</div>
              ))}
              <div className="pt-2 text-xs text-muted-foreground/80">
                {t("topup.package.estimate")}
              </div>
            </div>

            <div className="mt-4">
              <Button className="w-full" disabled={state.creating} onClick={() => void createOrder(p)}>
                {state.creating && state.creatingAmountVnd === p.amountVnd ? (
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {t("topup.package.createQr")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Order History Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t("topup.history.title")}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (showHistory) {
                setShowHistory(false);
              } else {
                loadOrderHistory();
                setShowHistory(true);
              }
            }}
            disabled={loadingHistory}
          >
            {loadingHistory ? (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {showHistory ? t("topup.history.hide") : t("topup.history.view")}
          </Button>
        </div>

        {showHistory && (
          <div className="mt-4 space-y-2">
            {historyOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("topup.history.empty")}
              </div>
            ) : (
              historyOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{order.order_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatVnd(order.amount_vnd)}</div>
                      <div className="text-sm text-muted-foreground">{order.credits} credits</div>
                      <div className={`text-xs font-medium ${
                        order.status === "paid" ? "text-green-600" : 
                        order.status === "pending" ? "text-yellow-600" : 
                        order.status === "expired" ? "text-red-600" : "text-gray-600"
                      }`}>
                        {order.status === "paid" ? t("topup.status.paid") :
                         order.status === "pending" ? t("topup.status.pending") :
                         order.status === "expired" ? t("topup.status.expired") :
                         t("topup.status.canceled")}
                      </div>
                    </div>
                  </div>
                  {order.status === "pending" && order.qr_url && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_ORDER', payload: order });
                          persistActiveOrder(order);
                        }}
                      >
                        {t("topup.history.viewQr")}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
