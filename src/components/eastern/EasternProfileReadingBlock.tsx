import { Activity } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EasternAnalysisResult from "@/components/eastern/EasternAnalysisResult";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import React from "react";
import type { EasternResult as EasternUploadResultType } from "@/components/eastern/EasternUploadResult";

type SectionItem = {
  title: string;
  content: string;
  source?: string;
};

type PalaceSection = {
  title: string;
  items: Array<{ text: string; source?: string }>;
};

type PeriodSection = {
  label: string;
  items: Array<{ text: string; source?: string }>;
};

type EasternResult = EasternUploadResultType;

type Props = {
  t: (key: string) => string;
  loading: boolean;
  runAnalyze: () => Promise<void>;
  result: EasternResult | null;
  highlightId: string | null;
  setOpenPalaceId: (id: string | null) => void;
  focusSection: (id: string) => void;
  scrollToId: (id: string) => void;
  renderMarkdown: (text: string) => React.ReactNode;
  splitParagraphs: (text: string) => string[];
  slugify: (value: string) => string;
  isPalaceSectionTitle: (title: string) => boolean;
  qaOpen: boolean;
  setQaOpen: (open: boolean) => void;
  qaSessionKey: string | null;
  lastReadingId: string | null;
  profile: unknown;
  selectedOption: string | null;
  qaContextJson?: unknown;
};

export default function EasternProfileReadingBlock({
  t,
  loading,
  runAnalyze,
  result,
  highlightId,
  setOpenPalaceId,
  focusSection,
  scrollToId,
  renderMarkdown,
  splitParagraphs,
  slugify,
  isPalaceSectionTitle,
  qaOpen,
  setQaOpen,
  qaSessionKey,
  lastReadingId,
  profile,
  selectedOption,
  qaContextJson,
}: Props) {
  return (
    <Reveal from="up" offset={18} delay={0.05}>
      <Card className="p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t("eastern.profileReading.title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("eastern.profileReading.desc")}</p>
          </div>
          <Button
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity sm:w-auto"
            onClick={() => void runAnalyze()}
            disabled={loading}
          >
            {loading ? t("eastern.profileReading.analyzing") : t("eastern.profileReading.start")}
          </Button>
        </div>

        {loading && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" animate animateOnHover={false} animation="default" loop />
              <p className="text-sm font-medium text-foreground">{t("eastern.loading.title")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("eastern.loading.desc")}</p>
          </div>
        )}

        {result && (
          <Reveal className="mt-6" from="up" offset={18} delay={0.05}>
            <EasternAnalysisResult
              t={t}
              result={result}
              highlightId={highlightId}
              setOpenPalaceId={setOpenPalaceId}
              focusSection={focusSection}
              scrollToId={scrollToId}
              renderMarkdown={renderMarkdown}
              splitParagraphs={splitParagraphs}
              slugify={slugify}
              isPalaceSectionTitle={isPalaceSectionTitle}
              qaOpen={qaOpen}
              setQaOpen={setQaOpen}
              qaSessionKey={qaSessionKey}
              lastReadingId={lastReadingId}
              profile={profile}
              selectedOption={selectedOption}
              qaContextJson={qaContextJson}
            />
          </Reveal>
        )}
      </Card>
    </Reveal>
  );
}
