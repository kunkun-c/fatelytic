import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, Brain, Shield, BarChart3, ArrowRight } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import heroBg from "@/assets/hero-bg.jpg";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { BubbleBackground } from "@/components/animate-ui/primitives/backgrounds/bubble";

const Index = () => {
  const { t } = useI18n();
  const { user, loading } = useAuth();

  useLayoutConfig({
    seo: { titleKey: "seo.home.title", descriptionKey: "seo.home.desc", path: "/" },
    disableContentWrapper: true,
  });

  // Redirect logged-in users to overview page
  if (!loading && user) {
    return <Navigate to="/overview" replace />;
  }

  const features = [
    { icon: Brain, title: t("landing.feature1.title"), description: t("landing.feature1.desc") },
    { icon: Compass, title: t("landing.feature2.title"), description: t("landing.feature2.desc") },
    { icon: BarChart3, title: t("landing.feature3.title"), description: t("landing.feature3.desc") },
    { icon: Shield, title: t("landing.feature4.title"), description: t("landing.feature4.desc") },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <BubbleBackground
          interactive
          className="opacity-60"
          colors={{
            first: "59,130,246",
            second: "168,85,247",
            third: "34,211,238",
            fourth: "244,114,182",
            fifth: "251,191,36",
            sixth: "99,102,241",
          }}
        />
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-25 bg-muted"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
        <div className="relative container mx-auto px-4 py-16 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal from="up" offset={22}>
              <h1 className="mb-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                <GradientText text={t("landing.hero.title")} />
              </h1>
            </Reveal>

            <Reveal from="up" offset={22} delay={0.05}>
              <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("landing.hero.subtitle")}
              </p>
            </Reveal>

            <Reveal from="up" offset={22} delay={0.1}>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link to="/eastern-astrology">
                  <Button size="lg" className="gap-2 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    {t("landing.hero.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" size="lg" className="text-base">
                    {t("landing.hero.explore")}
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <Reveal from="up" offset={18}>
          <div className="mx-auto mb-12 max-w-lg text-center">
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">{t("landing.howItWorks")}</h2>
            <p className="text-muted-foreground">{t("landing.howItWorksDesc")}</p>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} from="up" offset={18} delay={0.03 * i}>
              <div className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30">
                <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1">
                  <f.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Disclaimer Banner */}
      <section className="container mx-auto px-4 pb-12 md:pb-20">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-secondary/50 px-6 py-5 text-center">
          <p className="text-sm text-muted-foreground">{t("landing.disclaimer")}</p>
        </div>
      </section>
    </div>
  );
};

export default Index;
