import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function Topup() {
  const { lang } = useI18n();
  const { session } = useAuth();
  const [creating, setCreating] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderRow | null>(null);
  const [polling, setPolling] = useState(false);

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

  const startPolling = useCallback((orderId: string) => {
    setPolling(true);
    const t = window.setInterval(async () => {
      const next = await fetchOrder(orderId);
      if (!next) return;
      setActiveOrder(next);
      if (next.status === "paid") {
        window.clearInterval(t);
        setPolling(false);
        toast.success(lang === "vi" ? "Nạp credit thành công." : "Top up successful.");
      }
    }, 4000);

    return () => {
      window.clearInterval(t);
      setPolling(false);
    };
  }, [fetchOrder, lang]);

  const createOrder = useCallback(
    async (pkg: PackageOption) => {
      setCreating(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        // Get token from auth context session
        let accessToken = session?.access_token ?? null;

        // If no token, try to refresh session
        if (!accessToken) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error("Session refresh error:", refreshError);
            toast.error(lang === "vi" ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." : "Session expired. Please sign in again.");
            return;
          }
          accessToken = refreshData.session?.access_token ?? null;
        }
        
        if (!accessToken) {
          toast.error(lang === "vi" ? "Vui lòng đăng nhập." : "Please sign in.");
          return;
        }

        // Restore auth header with the actual token
        const res = await fetch(`${supabaseUrl}/functions/v1/create-topup-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ amountVnd: pkg.amountVnd, credits: pkg.credits }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to create order");
        }

        const json = (await res.json()) as { order?: OrderRow };
        if (!json.order) throw new Error("Invalid response");

        setActiveOrder(json.order);
        startPolling(json.order.id);
      } catch (err) {
        console.error(err);
        toast.error(lang === "vi" ? "Không tạo được QR nạp tiền." : "Failed to create top up QR.");
      } finally {
        setCreating(false);
      }
    },
    [lang, startPolling, session]
  );

  useEffect(() => {
    if (!activeOrder?.id) return;
    if (activeOrder.status !== "pending") return;
    const stop = startPolling(activeOrder.id);
    return stop;
  }, [activeOrder?.id, activeOrder?.status, startPolling]);

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
              <Button className="w-full" disabled={creating} onClick={() => void createOrder(p)}>
                {lang === "vi" ? "Tạo QR thanh toán" : "Create payment QR"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {activeOrder && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-base font-semibold text-foreground">
                {lang === "vi" ? "Đơn nạp đang chờ thanh toán" : "Pending order"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {lang === "vi" ? "Nội dung chuyển khoản" : "Transfer description"}: <span className="font-mono text-foreground">{activeOrder.order_code}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {lang === "vi" ? "Số tiền" : "Amount"}: <span className="text-foreground">{formatVnd(activeOrder.amount_vnd)}</span> · {lang === "vi" ? "Credit" : "Credits"}: <span className="text-foreground">{activeOrder.credits}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {lang === "vi" ? "Trạng thái" : "Status"}: <span className="text-foreground">{activeOrder.status}{polling ? " (checking...)" : ""}</span>
              </div>
            </div>

            {activeOrder.qr_url ? (
              <div className="flex flex-col items-center gap-2">
                <img src={activeOrder.qr_url} alt="SePay QR" className="h-44 w-44 rounded-lg border border-border bg-background" />
                <a
                  href={activeOrder.qr_url}
                  download
                  className="text-sm font-medium text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {lang === "vi" ? "Tải ảnh QR" : "Download QR"}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
