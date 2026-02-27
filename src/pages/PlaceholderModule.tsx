import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";

interface Props {
  moduleKey: "eastern" | "western" | "tarot" | "iching" | "career";
}

const PlaceholderModule = ({ moduleKey }: Props) => {
  const { t } = useI18n();
  const titleKey = `placeholder.${moduleKey}.title`;
  const descKey = `placeholder.${moduleKey}.desc`;

  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4 py-10 md:py-16">
      <div className="mx-auto max-w-md text-center">
        <Reveal from="up" offset={18}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
        </Reveal>
        <Reveal from="up" offset={18} delay={0.05}>
          <h1 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
            <GradientText text={t(titleKey)} />
          </h1>
        </Reveal>
        <Reveal from="up" offset={18} delay={0.08}>
          <p className="mb-6 text-muted-foreground">{t(descKey)}</p>
        </Reveal>
        <Reveal from="up" offset={18} delay={0.1}>
          <Link to="/explore">
            <Button variant="outline" size="lg">{t("placeholder.backToDashboard")}</Button>
          </Link>
        </Reveal>
      </div>
    </div>
  );
};

export default PlaceholderModule;
