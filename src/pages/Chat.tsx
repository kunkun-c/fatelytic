import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "react-router-dom";
import type { NumerologyResult } from "@/lib/numerology";
import ChatPanel from "@/components/ChatPanel";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

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
    seo: { titleKey: "seo.chat.title", descriptionKey: "seo.chat.desc", path: "/chat" },
    disableContentWrapper: true,
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
    <div className="container mx-auto flex max-w-2xl flex-col px-4 py-4 md:py-6" style={{ height: 'calc(100dvh - 4rem)' }}>
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t("chat.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("chat.subtitle")}</p>
        {numerologyContext && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("chat.numerologyContext")}
          </p>
        )}
      </div>

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
                { label: "Giải thích kết quả Thần số học", prompt: "Hãy giải thích chi tiết kết quả thần số học của tôi." },
                { label: "Định hướng nghề nghiệp", prompt: "Dựa trên hồ sơ của tôi, hãy tư vấn định hướng nghề nghiệp phù hợp." },
                { label: "Phát triển cá nhân", prompt: "Tôi muốn được tư vấn về phát triển bản thân và điểm mạnh/yếu." },
                { label: "Phân tích tổng hợp", prompt: "Hãy phân tích tổng hợp các khía cạnh tâm lý và tiềm năng của tôi." },
              ]
            : undefined
        }
      />
    </div>
  );
};

export default Chat;
