import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

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
        <h1 className="mb-4 text-5xl font-display font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">{t("notFound.title")}</p>
        <a href="/" className="font-semibold text-primary hover:underline">
          {t("notFound.back")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
