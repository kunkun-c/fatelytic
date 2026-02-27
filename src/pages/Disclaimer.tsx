import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";

const Disclaimer = () => {
  const { t } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.disclaimer.title", descriptionKey: "seo.disclaimer.desc", path: "/disclaimer" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal from="up" offset={18}>
        <h1 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">
          <GradientText text={t("disclaimer.title")} />
        </h1>
      </Reveal>
      <Reveal from="up" offset={18} delay={0.05}>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <p>{t("disclaimer.p1")}</p>
          <p>{t("disclaimer.p2")}</p>
          <p>{t("disclaimer.p3")}</p>
          <p>{t("disclaimer.p4")}</p>
          <p className="font-bold">{t("disclaimer.footer")}</p>
        </div>
      </Reveal>
    </div>
  );
};

export default Disclaimer;
