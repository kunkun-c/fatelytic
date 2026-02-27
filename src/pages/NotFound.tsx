import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.notFound.title", descriptionKey: "seo.notFound.desc", path: "" },
    disableContentWrapper: true,
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Reveal from="up" offset={18}>
          <h1 className="mb-4 text-5xl font-display font-bold text-foreground">
            <GradientText text="404" />
          </h1>
        </Reveal>
        <Reveal from="up" offset={18} delay={0.05}>
          <p className="mb-6 text-lg text-muted-foreground">{t("notFound.title")}</p>
        </Reveal>
        <Reveal from="up" offset={18} delay={0.08}>
          <a href="/" className="font-semibold text-primary hover:underline">
            {t("notFound.back")}
          </a>
        </Reveal>
      </div>
    </div>
  );
};

export default NotFound;
