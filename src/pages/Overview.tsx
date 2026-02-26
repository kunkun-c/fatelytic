import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

const Overview = () => {
  const { t } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.overview.title", descriptionKey: "seo.overview.desc", path: "/overview" },
    disableContentWrapper: true,
  });

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary animate-fade-in">
          <Compass className="h-8 w-8 text-white" />
        </div>

        <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {t("overview.comingSoon")}
        </span>

        <h1 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl animate-fade-in" style={{ animationDelay: "0.15s" }}>
          {t("overview.title")}
        </h1>

        <p className="mt-2 text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {t("overview.subtitle")}
        </p>

        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground animate-fade-in" style={{ animationDelay: "0.25s" }}>
          {t("overview.desc")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Link to="/eastern-astrology">
            <Button size="lg" className="gap-2 bg-gradient-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
              {t("overview.tryEastern")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="lg">
              {t("overview.explore")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Overview;
