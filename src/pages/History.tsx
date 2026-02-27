import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Upload, Sparkles, Briefcase, Heart, Wallet, Activity, Calendar, Image as ImageIcon } from "@/components/ui/icons";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NumerologyResult } from "@/lib/numerology";
import type { Json } from "@/integrations/supabase/types";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";

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
  labelKey: string;
  descKey: string;
};

const EASTERN_OPTIONS: EasternOptionSpec[] = [
  { id: "upload", labelKey: "history.eastern.option.upload.label", descKey: "history.eastern.option.upload.desc" },
  { id: "overview", labelKey: "history.eastern.option.overview.label", descKey: "history.eastern.option.overview.desc" },
  { id: "career", labelKey: "history.eastern.option.career.label", descKey: "history.eastern.option.career.desc" },
  { id: "marriage", labelKey: "history.eastern.option.marriage.label", descKey: "history.eastern.option.marriage.desc" },
  { id: "finance", labelKey: "history.eastern.option.finance.label", descKey: "history.eastern.option.finance.desc" },
  { id: "health", labelKey: "history.eastern.option.health.label", descKey: "history.eastern.option.health.desc" },
  { id: "fortune", labelKey: "history.eastern.option.fortune.label", descKey: "history.eastern.option.fortune.desc" },
  { id: "image", labelKey: "history.eastern.option.image.label", descKey: "history.eastern.option.image.desc" },
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
  const { t, lang } = useI18n();
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
    <div className="mx-auto max-w-2xl">
        <Reveal from="up" offset={18}>
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t("history.title")}</h1>
          <p className="mb-8 text-muted-foreground">{t("history.subtitle")}</p>
        </Reveal>

        {readings.length === 0 && easternReadings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center sm:py-16">
            <p className="mb-1 text-lg font-display font-bold text-foreground">{t("history.empty")}</p>
            <p className="mb-6 text-sm text-muted-foreground">{t("history.emptyDesc")}</p>
            <Link to="/explore">
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">{t("history.explore")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-base font-semibold text-foreground">{t("history.section.eastern")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("history.section.easternDesc")}</p>

              {easternReadings.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">{t("history.section.emptyTitle")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("history.section.emptyDesc")}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-6">
                  {EASTERN_OPTIONS.map((opt) => {
                    const rows = easternReadings.filter((r) => getEasternInputMeta(r.input_json).optionId === opt.id);
                    if (rows.length === 0) return null;
                    return (
                      <Reveal key={opt.id} from="up" offset={18}>
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{t(opt.labelKey)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{t(opt.descKey)}</p>
                          </div>

                          <div className="mt-4 space-y-3">
                            {rows.map((reading, idx) => {
                            const input = getEasternInputMeta(reading.input_json);
                            const fileName = input.uploadFileName ?? null;
                            const url = input.uploadPublicUrl ?? null;
                            return (
                              <Reveal key={reading.id} from="up" offset={16} delay={0.02 * idx}>
                                <div className="rounded-xl border border-border bg-background p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-muted-foreground">{formatDateTime(reading.created_at, lang)}</p>
                                      {opt.id === "upload" && (
                                        <p className="mt-1 text-sm font-semibold text-foreground truncate">{fileName ?? t("history.eastern.defaultFileName")}</p>
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
                                            {t("history.eastern.viewSavedImage")}
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
                              </Reveal>
                            );
                          })}
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">{t("history.section.numerology")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("history.section.numerologyDesc")}</p>

              {readings.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">{t("history.section.emptyTitle")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("history.section.emptyDesc")}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {readings.map((reading, idx) => (
                    <Reveal key={reading.id} from="up" offset={14} delay={0.02 * idx}>
                      <div className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">{formatDateTime(reading.created_at, lang)}</p>
                            <p className="mt-1 text-sm font-semibold text-foreground truncate">{reading.full_name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{reading.date_of_birth}</p>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <Button variant="ghost" size="sm" onClick={() => viewReading(reading)}>
                              {t("history.view")}
                            </Button>
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
                    </Reveal>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground">{t("history.section.comingSoon")}</h2>
              <div className="mt-4 space-y-3">
                {([
                  {
                    titleKey: "history.comingSoon.western.title",
                    descKey: "history.comingSoon.western.desc",
                  },
                  {
                    titleKey: "history.comingSoon.tarot.title",
                    descKey: "history.comingSoon.tarot.desc",
                  },
                  {
                    titleKey: "history.comingSoon.iching.title",
                    descKey: "history.comingSoon.iching.desc",
                  },
                  {
                    titleKey: "history.comingSoon.career.title",
                    descKey: "history.comingSoon.career.desc",
                  },
                ] as const).map((item) => (
                  <div key={item.titleKey} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm font-semibold text-foreground">{t(item.titleKey)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(item.descKey)}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("history.comingSoon.badge")}</p>
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
