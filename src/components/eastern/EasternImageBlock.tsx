import { Clock, Sparkles } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import React from "react";

type Props = {
  t: (key: string) => string;
  loading: boolean;
  runGeneratePartnerImage: () => Promise<void>;
};

export default function EasternImageBlock({
  t,
  loading,
  runGeneratePartnerImage,
}: Props) {
  return (
    <Reveal from="up" offset={18} delay={0.05}>
      <Card className="p-5 shadow-sm space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("eastern.image.inputOptions.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("eastern.image.inputOptions.desc")}</p>
        </div>

        <Button
          size="lg"
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity mt-6 gap-2"
          onClick={() => void runGeneratePartnerImage()}
          disabled={loading}
        >
          <Sparkles className="h-4 w-4" animate animateOnHover={false} animation="default" loop />
          {loading ? t("eastern.image.generating") : t("eastern.image.generate")}
        </Button>

        {loading && (
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" animate animateOnHover={false} animation="default" loop />
              <p className="text-sm font-medium text-foreground">{t("eastern.image.slowTitle")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("eastern.image.slowDesc")}</p>
          </div>
        )}
      </Card>
    </Reveal>
  );
}
