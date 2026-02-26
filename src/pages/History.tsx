import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NumerologyResult } from "@/lib/numerology";
import type { Json } from "@/integrations/supabase/types";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

interface Reading {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string | null;
  life_path_number: number;
  expression_number: number;
  soul_urge_number: number;
  result_json: NumerologyResult;
  created_at: string;
}

type EasternReading = {
  id: string;
  input_json: Json;
  result_json: Json;
  created_at: string;
};

type EasternInputMeta = {
  optionId?: string;
  uploadFileName?: string | null;
  uploadPublicUrl?: string | null;
};

type EasternOptionSpec = {
  id: string;
  label: string;
  desc: string;
};

const EASTERN_OPTIONS: EasternOptionSpec[] = [
  { id: "upload", label: "Tải lá số", desc: "Upload ảnh lá số tử vi để luận giải chi tiết" },
  { id: "overview", label: "Luận giải tổng quan", desc: "Phân tích toàn diện lá số dựa trên thông tin cá nhân" },
  { id: "career", label: "Sự nghiệp & Công danh", desc: "Phân tích cung Quan Lộc và xu hướng nghề nghiệp" },
  { id: "marriage", label: "Hôn nhân & Gia đạo", desc: "Luận giải cung Phu Thê và tình duyên" },
  { id: "finance", label: "Tài chính & Tài vận", desc: "Phân tích cung Tài Bạch và vận tài lộc" },
  { id: "health", label: "Sức khoẻ & Phúc đức", desc: "Phân tích cung Tật Ách và Phúc Đức" },
  { id: "fortune", label: "Thời vận & Đại vận", desc: "Xem vận hạn theo từng giai đoạn cuộc đời" },
  { id: "image", label: "Ảnh minh hoạ vợ chồng", desc: "Tạo ảnh minh hoạ phong cách Á Đông" },
];

const getEasternInputMeta = (value: Json): EasternInputMeta => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    return {
      optionId: typeof v.optionId === "string" ? v.optionId : undefined,
      uploadFileName: typeof v.uploadFileName === "string" ? v.uploadFileName : null,
      uploadPublicUrl: typeof v.uploadPublicUrl === "string" ? v.uploadPublicUrl : null,
    };
  }
  return {};
};

const fetchReadings = async (): Promise<Reading[]> => {
  const { data, error } = await supabase
    .from("numerology_readings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Reading[];
};

const fetchEasternReadings = async (): Promise<EasternReading[]> => {
  const { data, error } = await supabase
    .from("eastern_readings")
    .select("id,input_json,result_json,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as EasternReading[];
};

const History = () => {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useLayoutConfig({
    seo: { titleKey: "seo.history.title", descriptionKey: "seo.history.desc", path: "/history" },
  });

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: fetchReadings,
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

  const deleteEasternMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eastern_readings").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["history-eastern", user?.id] });
      const prev = qc.getQueryData<EasternReading[]>(["history-eastern", user?.id]);
      qc.setQueryData<EasternReading[]>(["history-eastern", user?.id], (old) => old?.filter((r) => r.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) qc.setQueryData(["history-eastern", user?.id], context.prev);
      toast.error(t("history.deleteError"));
    },
    onSuccess: () => {
      toast.success(t("history.deleteSuccess"));
    },
  });

  const { data: easternReadings = [], isLoading: easternLoading } = useQuery({
    queryKey: ["history-eastern", user?.id],
    queryFn: fetchEasternReadings,
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("numerology_readings").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["history", user?.id] });
      const prev = qc.getQueryData<Reading[]>(["history", user?.id]);
      qc.setQueryData<Reading[]>(["history", user?.id], (old) => old?.filter((r) => r.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) qc.setQueryData(["history", user?.id], context.prev);
      toast.error(t("history.deleteError"));
    },
    onSuccess: () => {
      toast.success(t("history.deleteSuccess"));
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const viewReading = (reading: Reading) => {
    navigate("/result", {
      state: {
        result: reading.result_json,
        fullName: reading.full_name,
        dateOfBirth: reading.date_of_birth,
        gender: reading.gender,
      },
    });
  };

  const viewEasternReading = (reading: EasternReading) => {
    navigate("/eastern-astrology", {
      state: {
        reading,
      },
    });
  };

  if (isLoading || easternLoading || authLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
        <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t("history.title")}</h1>
        <p className="mb-8 text-muted-foreground">{t("history.subtitle")}</p>

        {readings.length === 0 && easternReadings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center sm:py-16">
            <p className="mb-1 text-lg font-display font-bold text-foreground">{t("history.empty")}</p>
            <p className="mb-6 text-sm text-muted-foreground">{t("history.emptyDesc")}</p>
            <Link to="/dashboard">
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">Khám Phá</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-base font-semibold text-foreground">Tử Vi Phương Đông</h2>
              <p className="mt-1 text-sm text-muted-foreground">Phân tích Tử Vi và Bát Tự để hiểu sâu hơn về bản thân.</p>

              {easternReadings.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">Chưa có dữ liệu</p>
                  <p className="mt-1 text-xs text-muted-foreground">Hãy xem một luận giải để lưu vào lịch sử.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-6">
                  {EASTERN_OPTIONS.map((opt) => {
                    const rows = easternReadings.filter((r) => getEasternInputMeta(r.input_json).optionId === opt.id);
                    if (rows.length === 0) return null;
                    return (
                      <div key={opt.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                        </div>

                        <div className="mt-4 space-y-3">
                          {rows.map((reading) => {
                            const input = getEasternInputMeta(reading.input_json);
                            const fileName = input.uploadFileName ?? null;
                            const url = input.uploadPublicUrl ?? null;
                            return (
                              <div key={reading.id} className="rounded-xl border border-border bg-background p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-muted-foreground">{new Date(reading.created_at).toLocaleString("vi-VN")}</p>
                                    {opt.id === "upload" && (
                                      <p className="mt-1 text-sm font-semibold text-foreground truncate">{fileName ?? "Lá số tử vi"}</p>
                                    )}
                                    {url && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-primary underline underline-offset-2 truncate"
                                        >
                                          Xem ảnh đã lưu
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex shrink-0 gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => viewEasternReading(reading)}>
                                      {t("history.view")}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:bg-destructive/10"
                                      onClick={() => deleteEasternMutation.mutate(reading.id)}
                                      disabled={deleteEasternMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">Thần Số Học</h2>
              <p className="mt-1 text-sm text-muted-foreground">Khám phá Số Chủ Đạo và định hướng nghề nghiệp qua tâm lý số học.</p>

              {readings.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">Chưa có dữ liệu</p>
                  <p className="mt-1 text-xs text-muted-foreground">Hãy xem một kết quả để lưu vào lịch sử.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {readings.map((reading, idx) => (
                    <div
                      key={reading.id}
                      className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md animate-fade-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-lg font-bold text-foreground truncate">{reading.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reading.date_of_birth).toLocaleDateString("vi-VN")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-center">
                              <p className="text-lg font-bold text-primary">{reading.life_path_number}</p>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("result.lifePath")}</p>
                            </div>
                            <div className="rounded-lg bg-secondary px-3 py-1.5 text-center">
                              <p className="text-lg font-bold text-foreground">{reading.expression_number}</p>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("result.expression")}</p>
                            </div>
                            <div className="rounded-lg bg-secondary px-3 py-1.5 text-center">
                              <p className="text-lg font-bold text-foreground">{reading.soul_urge_number}</p>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("result.soulUrge")}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewReading(reading)}>{t("history.view")}</Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMutation.mutate(reading.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">Sắp ra mắt</h2>
              <div className="mt-4 space-y-3">
                {[
                  {
                    title: "Chiêm Tinh Phương Tây",
                    desc: "Giải đọc bản đồ sao qua lăng kính tâm lý hiện đại.",
                  },
                  {
                    title: "Tarot",
                    desc: "Đọc bài Tarot suy ngẫm giúp ra quyết định rõ ràng.",
                  },
                  {
                    title: "Kinh Dịch",
                    desc: "Trí tuệ cổ đại được diễn giải qua góc nhìn tâm lý.",
                  },
                  {
                    title: "Tư Vấn Nghề Nghiệp",
                    desc: "Khai phá con đường nghề nghiệp phù hợp với bộ chỉ số tự khám phá của bạn.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sắp ra mắt</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
  );
};

export default History;
