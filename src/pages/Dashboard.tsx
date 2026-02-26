import { Link } from "react-router-dom";
import { Hash, Globe, Star, Layers, BookOpen, Brain, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

const Dashboard = () => {
  const { t } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.dashboard.title", descriptionKey: "seo.dashboard.desc", path: "/dashboard" },
    showUserContextBanner: true,
    userContextBannerClassName: "mb-6",
  });

  const modules = [
    { title: t("nav.easternAstrology"), description: t("dashboard.eastern.desc"), icon: Globe, path: "/eastern-astrology", active: true },
    { title: t("nav.numerology"), description: t("dashboard.numerology.desc"), icon: Hash, path: "/calculator", active: false },
    { title: t("nav.westernAstrology"), description: t("dashboard.western.desc"), icon: Star, path: "/western-astrology", active: false },
    { title: t("nav.tarot"), description: t("dashboard.tarot.desc"), icon: Layers, path: "/tarot", active: false },
    { title: t("nav.iching"), description: t("dashboard.iching.desc"), icon: BookOpen, path: "/iching", active: false },
    { title: t("nav.careerAi"), description: t("dashboard.career.desc"), icon: Brain, path: "/career-ai", active: false },
  ];

  return (
    <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <div
              key={m.title}
              className={`group flex items-start gap-4 rounded-xl border bg-card p-5 transition-all ${
                m.active 
                  ? "border-border hover:shadow-lg hover:border-primary/30 cursor-pointer" 
                  : "border-border/50 opacity-60 cursor-not-allowed"
              }`}
            >
              {m.active ? (
                <Link to={m.path} className="flex items-start gap-4 w-full">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-bold text-foreground">{m.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ) : (
                <>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <m.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-bold text-foreground">{m.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                    <p className="mt-2 text-xs font-semibold text-primary">Sắp ra mắt</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">{t("dashboard.comingSoon")}</p>
      </div>
  );
};

export default Dashboard;
