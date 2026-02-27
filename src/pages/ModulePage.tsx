import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { Calendar, Clock } from "@/components/ui/icons";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";

interface ModulePageProps {
  moduleKey: "numerology" | "eastern" | "western" | "tarot" | "iching" | "career";
}

const ModulePage = ({ moduleKey }: ModulePageProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const moduleMeta = useMemo(() => {
    const map = {
      numerology: {
        title: t("module.numerology.title"),
        desc: t("module.numerology.desc"),
        path: "/calculator",
        seoTitleKey: "seo.calc.title",
        seoDescKey: "seo.calc.desc",
        isComingSoon: true,
      },
      eastern: {
        title: t("module.eastern.title"),
        desc: t("module.eastern.desc"),
        path: "/eastern-astrology",
        seoTitleKey: "seo.eastern.title",
        seoDescKey: "seo.eastern.desc",
        isComingSoon: false,
      },
      western: {
        title: t("module.western.title"),
        desc: t("module.western.desc"),
        path: "/western-astrology",
        seoTitleKey: "seo.western.title",
        seoDescKey: "seo.western.desc",
        isComingSoon: true,
      },
      tarot: {
        title: t("module.tarot.title"),
        desc: t("module.tarot.desc"),
        path: "/tarot",
        seoTitleKey: "seo.tarot.title",
        seoDescKey: "seo.tarot.desc",
        isComingSoon: true,
      },
      iching: {
        title: t("module.iching.title"),
        desc: t("module.iching.desc"),
        path: "/iching",
        seoTitleKey: "seo.iching.title",
        seoDescKey: "seo.iching.desc",
        isComingSoon: true,
      },
      career: {
        title: t("module.career.title"),
        desc: t("module.career.desc"),
        path: "/career-ai",
        seoTitleKey: "seo.career.title",
        seoDescKey: "seo.career.desc",
        isComingSoon: true,
      },
    } as const;

    return map[moduleKey];
  }, [moduleKey, t]);

  useLayoutConfig({
    seo: { titleKey: moduleMeta.seoTitleKey, descriptionKey: moduleMeta.seoDescKey, path: moduleMeta.path },
  });

  const handleStart = () => {
    navigate("/consultation", {
      state: {
        module: moduleKey,
        initialPrompt: prompt.trim() || undefined,
      },
    });
  };

  // Show coming soon page for modules marked as coming soon
  if (moduleMeta.isComingSoon) {
    return (
      <div className="mx-auto max-w-2xl">
        <Reveal from="up" offset={18}>
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold text-accent">{t("app.name")}</p>
            <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
              <GradientText text={moduleMeta.title} />
            </h1>
            <p className="text-muted-foreground">{moduleMeta.desc}</p>
          </div>
        </Reveal>

        <Reveal from="up" offset={18} delay={0.05}>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-foreground">{t("common.comingSoon")}</h2>
            <p className="mb-6 text-muted-foreground">{t("dashboard.comingSoon")}</p>
            <div className="space-y-3">
              <Link to="/eastern-astrology">
                <Button size="lg" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                  {t("overview.tryEastern")}
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg" className="w-full">
                  {t("overview.explore")}
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal from="up" offset={18}>
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold text-accent">{t("app.name")}</p>
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            <GradientText text={moduleMeta.title} />
          </h1>
          <p className="text-muted-foreground">{moduleMeta.desc}</p>
        </div>
      </Reveal>

      <Reveal from="up" offset={18} delay={0.05}>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <label className="mb-2 block text-sm font-medium text-foreground">{t("module.promptPlaceholder")}</label>
          <Input
            placeholder={t("module.promptPlaceholder")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
              {t("module.start")}
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
};

export default ModulePage;
