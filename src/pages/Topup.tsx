import { useCallback, useEffect, useMemo, useRef, useState, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type PackageOption = {
  amountVnd: number;
  credits: number;
  titleVi: string;
  taglineVi: string;
  benefitsVi: string[];
};

type OrderRow = {
  id: string;
  order_code: string;
  amount_vnd: number;
  credits: number;
  status: "pending" | "paid" | "expired" | "canceled";
  qr_url: string | null;
  created_at: string;
};

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
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_ORDER_STATE' };

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
    case 'CLEAR_ORDER_STATE':
      return {
        ...state,
        activeOrder: null,
        pendingPkg: null,
        creating: false,
        creatingAmountVnd: null,
        polling: false,
      };
    default:
      return state;
  }
};

export default function Topup() {
  const { lang } = useI18n();
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
  const mountTimeRef = useRef(Date.now());

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    dispatch({ type: 'SET_POLLING', payload: false });
    pollInFlightRef.current = false; // Reset in-flight flag
  }, []);

  // Enhanced stop polling with force flag
  const forceStopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    dispatch({ type: 'SET_POLLING', payload: false });
    pollInFlightRef.current = false;
    dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
  }, []);
  
  // Clear any active order on unmount to prevent polling on reload
  // Also clear stuck orders on mount to prevent freezing
  useEffect(() => {
    // Clear any stuck orders that might be causing the page to freeze
    dispatch({ type: 'CLEAR_ORDER_STATE' });
    
    // Clear any existing polling interval immediately
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    // Reset in-flight flag
    pollInFlightRef.current = false;
    
    // Add page visibility change listener to stop polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        forceStopPolling();
      }
    };
    
    // Add beforeunload listener to clean up on page reload/navigation
    const handleBeforeUnload = () => {
      forceStopPolling();
    };
    
    // Add pagehide listener as backup for mobile browsers
    const handlePageHide = () => {
      forceStopPolling();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      pollInFlightRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [forceStopPolling]);

  const packages = useMemo<PackageOption[]>(
    () => [
      {
        amountVnd: 29000,
        credits: 50,
        titleVi: "Gói Khởi Đầu",
        taglineVi: "Dùng thử nghiêm túc, hỏi nhanh gọn",
        benefitsVi: [
          "~50 lượt chat",
          "hoặc ~6 lần xem lá số (upload)",
          "hoặc ~2 lần tạo ảnh + vài lượt chat",
        ],
      },
      {
        amountVnd: 59000,
        credits: 120,
        titleVi: "Gói Tiêu Chuẩn",
        taglineVi: "Dùng thường xuyên cho luận giải",
        benefitsVi: [
          "~120 lượt chat",
          "hoặc ~15 lần xem lá số (upload)",
          "hoặc ~4 lần tạo ảnh + chat",
        ],
      },
      {
        amountVnd: 99000,
        credits: 220,
        titleVi: "Gói Nâng Cao",
        taglineVi: "Cân bằng giữa chat và chuyên sâu",
        benefitsVi: [
          "~220 lượt chat",
          "hoặc ~27 lần xem lá số (upload)",
          "hoặc ~8 lần tạo ảnh + chat",
        ],
      },
      {
        amountVnd: 199000,
        credits: 500,
        titleVi: "Gói Chuyên Sâu",
        taglineVi: "Tối ưu cho tạo ảnh và dùng dài hạn",
        benefitsVi: [
          "~500 lượt chat",
          "hoặc ~62 lần xem lá số (upload)",
          "hoặc ~20 lần tạo ảnh + chat",
        ],
      },
    ],
    []
  );

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
      const maxRetries = 150; // 150 * 4 seconds = 10 minutes max
      
      pollIntervalRef.current = window.setInterval(async () => {
        if (pollInFlightRef.current) return;
        pollInFlightRef.current = true;
        
        retryCount++;
        if (retryCount > maxRetries) {
          console.log('Max polling retries reached, stopping');
          stopPolling();
          toast.error(lang === "vi" ? "Đơn hàng hết hạn." : "Order expired.");
          dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
          return;
        }
        
        try {
          const next = await fetchOrder(orderId);
          if (!next) return;
          dispatch({ type: 'SET_ACTIVE_ORDER', payload: next });
          if (next.status === "paid") {
            if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            dispatch({ type: 'SET_POLLING', payload: false });
            toast.success(lang === "vi" ? "Nạp credit thành công." : "Top up successful.");
          } else if (next.status === "expired" || next.status === "canceled") {
            if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            dispatch({ type: 'SET_POLLING', payload: false });
            toast.error(lang === "vi" ? "Đơn hàng đã hết hạn hoặc bị hủy." : "Order expired or canceled.");
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
    [fetchOrder, lang, stopPolling]
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
        toast.error(lang === "vi" ? "Không tải được lịch sử đơn hàng." : "Failed to load order history.");
        return;
      }
      
      setHistoryOrders((data as OrderRow[]) || []);
    } catch (err) {
      console.error('Error loading order history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [session?.user, lang]);

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
      toast.error(lang === "vi" ? "Không tải được QR." : "Failed to download QR.");
    } finally {
      dispatch({ type: 'SET_DOWNLOADING', payload: false });
    }
  }, [state.activeOrder?.order_code, state.activeOrder?.qr_url, lang]);

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
            toast.error(lang === "vi" ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." : "Session expired. Please sign in again.");
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
          toast.error(lang === "vi" ? "Vui lòng đăng nhập." : "Please sign in.");
          setTimeout(() => {
            window.location.href = "/auth";
          }, 2000);
          return;
        }

        const accessToken = s.access_token;
        if (!accessToken) {
          toast.error(lang === "vi" ? "Vui lòng đăng nhập." : "Please sign in.");
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
      } catch (err) {
        console.error("Create order error:", err);
        toast.error(lang === "vi" ? "Không tạo được QR nạp tiền." : "Failed to create top up QR.");
        dispatch({ type: 'SET_ACTIVE_ORDER', payload: null });
      } finally {
        dispatch({ type: 'SET_CREATING', payload: false });
        dispatch({ type: 'SET_CREATING_AMOUNT', payload: null });
        dispatch({ type: 'SET_PENDING_PKG', payload: null });
      }
    },
    [lang, session]
  );

  // Remove auto-check for existing orders - user should choose package first

  // Start polling only when a new order is created and pending; do NOT poll on page load
  useEffect(() => {
    // Defensive checks to prevent polling on page reload or with invalid orders
    if (!state.activeOrder?.id) return;
    if (state.activeOrder.id === "__creating__") return;
    if (state.activeOrder.status !== "pending") return;
    
    // Prevent duplicate intervals and polling on page reload
    if (pollIntervalRef.current) return;
    if (state.polling) return; // Already polling
    
    // Additional safety check: don't start polling if we just mounted
    const mountTime = mountTimeRef.current;
    const orderCreatedAt = new Date(state.activeOrder.created_at).getTime();
    const timeSinceMount = mountTime - orderCreatedAt;
    
    // If order was created more than 30 seconds ago, don't start polling on page load
    if (timeSinceMount > 30000) {
      console.log('Order too old, not starting polling on page load');
      return;
    }
    
    // Check if this is likely a page reload scenario
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry && navigationEntry.type === 'reload') {
      console.log('Page reload detected, not starting polling');
      return;
    }
    
    const stop = startPolling(state.activeOrder.id);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeOrder?.id, state.activeOrder?.status, state.activeOrder?.created_at]); // startPolling excluded to prevent infinite loops

  // Close modal and show success when payment is complete
  useEffect(() => {
    if (state.activeOrder?.status === "paid") {
      toast.success(lang === "vi" ? "Nạp credit thành công!" : "Top up successful!");

      // Optimistically update local cached balance immediately.
      const delta = Number(state.activeOrder.credits ?? 0);
      if (Number.isFinite(delta) && delta > 0) {
        window.dispatchEvent(new CustomEvent("credit-spent", { detail: { delta } }));
      }

      forceStopPolling();
      
      // Trigger wallet balance refresh across the app
      window.dispatchEvent(new CustomEvent('wallet-refresh-needed'));
    }
  }, [state.activeOrder?.credits, state.activeOrder?.status, lang, forceStopPolling]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{lang === "vi" ? "Nạp Credit" : "Top up"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "vi"
            ? "Chọn gói phù hợp. Quét QR bằng app ngân hàng để chuyển khoản đúng nội dung. Credit sẽ tự cộng khi thanh toán thành công."
            : "Choose a package. Scan the QR with your banking app and include the correct description. Credits will be added automatically after payment."}
        </p>
      </div>

      {state.activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold">{lang === "vi" ? "Quét mã QR để thanh toán" : "Scan QR to pay"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "vi" 
                  ? `Chuyển ${formatVnd(state.activeOrder.amount_vnd)} với mã: ${state.activeOrder.order_code}`
                  : `Transfer ${formatVnd(state.activeOrder.amount_vnd)} with code: ${state.activeOrder.order_code}`
                }
              </p>
            </div>
            
            
            <div className="relative mb-4 flex justify-center">
              <div className="text-center">
                {state.activeOrder?.qr_url ? (
                  <img
                    src={state.activeOrder.qr_url}
                    alt="Payment QR Code"
                    className="h-64 w-64 rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="h-64 w-64 rounded-lg border bg-muted/40 shadow-sm">
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-foreground/40 border-t-transparent" />
                      <div className="space-y-2">
                        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                      </div>
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
                  {lang === "vi" ? "Tải ảnh QR" : "Download QR"}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>{lang === "vi" ? "Số credit sẽ được cộng tự động" : "Credits will be added automatically"}</p>
              {state.activeOrder.status === "pending" && state.polling && (
                <p className="text-xs">
                  {lang === "vi" ? "Đang chờ thanh toán..." : "Waiting for payment..."}
                </p>
              )}
            </div>
            
            <button
              onClick={() => {
                forceStopPolling();
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg px-3 py-2 text-sm hover:bg-accent"
            >
              {state.polling && state.activeOrder.status === "pending" ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              {state.polling && state.activeOrder.status === "pending" ? (lang === "vi" ? "Đang kiểm tra..." : "Checking...") : (lang === "vi" ? "Đóng" : "Close")}
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
                {lang === "vi" ? "Ước tính dựa trên giá credit theo tính năng." : "Estimates are based on feature credit costs."}
              </div>
            </div>

            <div className="mt-4">
              <Button className="w-full" disabled={state.creating} onClick={() => void createOrder(p)}>
                {state.creating && state.creatingAmountVnd === p.amountVnd ? (
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {lang === "vi" ? "Tạo QR thanh toán" : "Create payment QR"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Order History Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {lang === "vi" ? "Lịch sử nạp tiền" : "Top-up History"}
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
            {showHistory ? (lang === "vi" ? "Ẩn lịch sử" : "Hide History") : (lang === "vi" ? "Xem lịch sử" : "View History")}
          </Button>
        </div>

        {showHistory && (
          <div className="mt-4 space-y-2">
            {historyOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {lang === "vi" ? "Chưa có lịch sử nạp tiền." : "No top-up history yet."}
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
                        {order.status === "paid" ? (lang === "vi" ? "Đã thanh toán" : "Paid") :
                         order.status === "pending" ? (lang === "vi" ? "Chờ thanh toán" : "Pending") :
                         order.status === "expired" ? (lang === "vi" ? "Hết hạn" : "Expired") :
                         (lang === "vi" ? "Đã hủy" : "Canceled")}
                      </div>
                    </div>
                  </div>
                  {order.status === "pending" && order.qr_url && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dispatch({ type: 'SET_ACTIVE_ORDER', payload: order })}
                      >
                        {lang === "vi" ? "Xem QR" : "View QR"}
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
