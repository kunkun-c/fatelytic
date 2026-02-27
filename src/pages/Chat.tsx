import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "react-router-dom";
import type { NumerologyResult } from "@/lib/numerology";
import ChatPanel from "@/components/ChatPanel";
import { useLayoutConfig } from "@/components/layout/use-layout-config";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";

interface LocationState {
  result: NumerologyResult;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  module?: "numerology" | "eastern" | "western" | "tarot" | "iching" | "career";
  initialPrompt?: string;
}

const Chat = () => {
  const { t } = useI18n();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const numerologyContext = state?.result;
  const moduleKey = state?.module ?? "numerology";

  useLayoutConfig({
    seo: { titleKey: "seo.chat.title", descriptionKey: "seo.chat.desc", path: "/consultation" },
    disableContentWrapper: false,
    contentClassName: "container mx-auto flex max-w-3xl flex-col px-4 py-4 md:py-6",
    contentStyle: { height: "calc(100dvh - 4rem)" },
    showAdvisoryNotice: true,
    advisoryNoticeCompact: true,
    advisoryNoticeClassName: "mb-3",
  });

  const contextJson = useMemo(() => {
    if (!numerologyContext) return undefined;
    return {
      lifePathNumber: numerologyContext.lifePathNumber,
      strengths: numerologyContext.strengths,
      challenges: numerologyContext.challenges,
      careerSuggestions: numerologyContext.careerSuggestions,
      description: numerologyContext.description,
    };
  }, [numerologyContext]);

  return (
    <>
      <Reveal from="up" offset={18}>
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("chat.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("chat.subtitle")}</p>
          {numerologyContext && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("chat.numerologyContext")}
            </p>
          )}
        </div>
      </Reveal>

      <Reveal className="flex flex-1 flex-col" from="up" offset={18} delay={0.05}>
        <ChatPanel
          moduleKey={moduleKey}
          contextJson={contextJson}
          initialPrompt={state?.initialPrompt}
          heightClassName="flex-1"
          className="flex flex-1 flex-col"
          showQuickActions
          quickActions={
            moduleKey === "numerology"
              ? [
                  { label: t("chat.quickAction.explain"), prompt: t("chat.quickPrompt.explain") },
                  { label: t("chat.quickAction.career"), prompt: t("chat.quickPrompt.career") },
                  { label: t("chat.quickAction.growth"), prompt: t("chat.quickPrompt.growth") },
                  { label: t("chat.quickAction.summary"), prompt: t("chat.quickPrompt.summary") },
                ]
              : undefined
          }
        />
      </Reveal>
    </>
  );
};

export default Chat;
