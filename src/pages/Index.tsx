import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, Brain, Shield, BarChart3, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import heroBg from "@/assets/hero-bg.jpg";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

const Index = () => {
  const { t } = useI18n();

  useLayoutConfig({
    seo: { titleKey: "seo.home.title", descriptionKey: "seo.home.desc", path: "/" },
    disableContentWrapper: true,
  });

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
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
        <div className="relative container mx-auto px-4 py-16 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-3xl font-bold leading-tight tracking-tight text-gradient-primary sm:text-4xl md:text-5xl lg:text-6xl animate-fade-in">
              {t("landing.hero.title")}
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-in" style={{ animationDelay: "0.15s" }}>
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/eastern-astrology">
                <Button size="lg" className="gap-2 px-8 text-base bg-gradient-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:opacity-90 transition-all">
                  {t("landing.hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="text-base">
                  {t("landing.hero.explore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto mb-12 max-w-lg text-center">
          <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">{t("landing.howItWorks")}</h2>
          <p className="text-muted-foreground">{t("landing.howItWorksDesc")}</p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/20 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
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
