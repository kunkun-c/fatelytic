import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

const Disclaimer = () => {
  const { t } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.disclaimer.title", descriptionKey: "seo.disclaimer.desc", path: "/disclaimer" },
  });

  return (
    <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">{t("disclaimer.title")}</h1>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <p>{t("disclaimer.p1")}</p>
          <p>{t("disclaimer.p2")}</p>
          <p>{t("disclaimer.p3")}</p>
          <p>{t("disclaimer.p4")}</p>
          <p className="font-bold">{t("disclaimer.footer")}</p>
        </div>
      </div>
  );
};

export default Disclaimer;
