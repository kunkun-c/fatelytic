import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { useState } from "react";

const Overview = () => {
  const { t } = useI18n();
  const [ctaHover, setCtaHover] = useState(false);

  useLayoutConfig({
    seo: { titleKey: "seo.overview.title", descriptionKey: "seo.overview.desc", path: "/overview" },
    disableContentWrapper: false,
    contentClassName: "container mx-auto px-4 py-12 md:py-24",
  });

  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal from="up" offset={20}>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
          <Compass className="h-8 w-8 text-white" />
        </div>
      </Reveal>

      <Reveal from="up" offset={20} delay={0.05}>
        <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
          {t("overview.comingSoon")}
        </span>
      </Reveal>

      <Reveal from="up" offset={20} delay={0.08}>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          <GradientText text={t("overview.title")} />
        </h1>
      </Reveal>

      <Reveal from="up" offset={20} delay={0.1}>
        <p className="mt-2 text-muted-foreground">{t("overview.subtitle")}</p>
      </Reveal>

      <Reveal from="up" offset={20} delay={0.12}>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">{t("overview.desc")}</p>
      </Reveal>

      <Reveal from="up" offset={20} delay={0.15}>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/eastern-astrology">
            <AnimateIcon asChild animateOnHover>
              <Button
                size="lg"
                className="gap-2 shadow-lg shadow-primary/20"
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
              >
                {t("overview.tryEastern")}
                <ArrowRight className="h-4 w-4" animate={ctaHover} animateOnHover={false} />
              </Button>
            </AnimateIcon>
          </Link>
          <Link to="/explore">
            <Button variant="outline" size="lg">
              {t("overview.explore")}
            </Button>
          </Link>
        </div>
      </Reveal>
    </div>
  );
};

export default Overview;
