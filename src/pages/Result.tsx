import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageCircle, Download, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import type { NumerologyResult } from "@/lib/numerology";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

interface ResultState {
  result: NumerologyResult;
  fullName: string;
  dateOfBirth: string;
}

function CollapsibleCard({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
      >
        <h3 className="font-display text-base font-bold text-foreground sm:text-lg">{title}</h3>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="border-t border-border px-5 py-5 sm:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

const Result = () => {
  const location = useLocation();
  const state = location.state as ResultState | undefined;
  const { t, lang } = useI18n();
  const { user } = useAuth();

  useLayoutConfig({
    seo: { titleKey: "seo.result.title", descriptionKey: "seo.result.desc", path: "/result" },
  });

  if (!state?.result) return <Navigate to="/calculator" replace />;

  const { result, fullName } = state;

  return (
    <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold text-accent">{t("result.readingFor")} {fullName}</p>
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t("result.title")}</h1>
          <p className="text-muted-foreground">{t("result.subtitle")}</p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: t("result.lifePath"), value: result.lifePathNumber },
            { label: t("result.expression"), value: result.expressionNumber },
            { label: t("result.soulUrge"), value: result.soulUrgeNumber },
          ].map((n) => (
            <div key={n.label} className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-3xl font-display font-bold text-gradient-primary sm:text-4xl">{n.value}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{n.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <CollapsibleCard title={t("result.lifePathOverview")} defaultOpen>
            <p className="text-sm leading-relaxed text-foreground">{result.description}</p>
          </CollapsibleCard>

          <CollapsibleCard title={t("result.strengths")}>
            <div className="flex flex-wrap gap-2">
              {result.strengths.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">{s}</span>
              ))}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title={t("result.growthAreas")}>
            <div className="flex flex-wrap gap-2">
              {result.challenges.map((c) => (
                <span key={c} className="rounded-full bg-gold/15 px-3 py-1.5 text-sm font-medium text-foreground">{c}</span>
              ))}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title={t("result.career")}>
            <ul className="space-y-2">
              {result.careerSuggestions.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </CollapsibleCard>

          <CollapsibleCard title={t("result.relationship")}>
            <p className="text-sm leading-relaxed text-foreground">{result.relationshipStyle}</p>
          </CollapsibleCard>
        </div>

        {!user && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="mb-2 text-sm text-foreground">
              {lang === "vi" 
                ? "Đăng nhập để lưu kết quả này vào lịch sử của bạn" 
                : "Sign in to save this reading to your history"}
            </p>
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {lang === "vi" ? "Đăng nhập" : "Sign In"}
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <Link to="/chat" state={state}>
            <Button size="lg" className="w-full gap-2 shadow-md text-base">
              <MessageCircle className="h-5 w-5" />
              {t("result.askAi")}
            </Button>
          </Link>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" size="lg" className="gap-1.5 text-sm" disabled>
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("result.downloadPdf")}</span>
              <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">PRO</span>
            </Button>
            <Button variant="outline" size="lg" className="gap-1.5 text-sm" disabled>
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("result.dailyInsights")}</span>
              <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">PRO</span>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("result.disclaimer")}</p>
      </div>
  );
};

export default Result;
