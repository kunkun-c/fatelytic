import { ChevronDown, MessageCircle, Sparkles, Star, Lock } from "@/components/animate-ui/icons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ChatPanel from "@/components/ChatPanel";
import React from "react";

type TopicItem = { id: string; label: string; target: string };

type SectionItem = { title: string; content: string; source?: string };

type PalaceSection = {
  title: string;
  starAnalyses: Array<{ heading?: string; text: string; source?: string }>;
  summary: Array<{ text: string; source?: string; type?: string }>;
};

type PeriodSection = {
  label: string;
  items: Array<{ text: string; source?: string; type?: string }>;
};

export type EasternResult = {
  overview: string;
  sections: SectionItem[];
  overviewQuotes?: string[];
  detailSections?: SectionItem[];
  daiVan?: string[];
  tieuVan?: string[];
  overviewItems?: Array<{ heading?: string; text: string; source?: string; type?: string }>;
  palaceSections?: PalaceSection[];
  topics?: TopicItem[];
  daiVanSections?: PeriodSection[];
  tieuVanSections?: PeriodSection[];
};

type Props = {
  t: (key: string) => string;
  result: EasternResult;
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

export default function EasternUploadResult({
  t,
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
  const resolvedQaModuleKey = (() => {
    switch (selectedOption) {
      case "upload":
        return "eastern_upload" as const;
      case "overview":
        return "eastern_overview" as const;
      case "career":
        return "eastern_career" as const;
      case "finance":
        return "eastern_finance" as const;
      case "marriage":
        return "eastern_marriage" as const;
      case "health":
        return "eastern_health" as const;
      case "fortune":
        return "eastern_fortune" as const;
      default:
        return "eastern" as const;
    }
  })();

  const getItemTypeStyles = (type?: string) => {
    switch (type) {
      case "challenge":
        return "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20";
      case "advice":
        return "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20";
      case "strength":
        return "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20";
      case "opportunity":
        return "border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20";
      default:
        return "";
    }
  };

  const getItemTypeIcon = (type?: string) => {
    switch (type) {
      case "challenge":
        return <Lock className="h-4 w-4 text-amber-500" animate="default" loop />;
      case "advice":
        return <MessageCircle className="h-4 w-4 text-blue-500" animate="default" loop />;
      case "strength":
        return <Sparkles className="h-4 w-4 text-green-500" animate="default" loop />;
      case "opportunity":
        return <Star className="h-4 w-4 text-purple-500" animate="fill" loop />;
      default:
        return null;
    }
  };

  const legacySections = (result.sections || []).filter((s) => s?.title && s?.content);
  const structuredPalaces = (result.palaceSections || []).filter((s) => s?.title && (Array.isArray(s.starAnalyses) || Array.isArray(s.summary)) && (s.starAnalyses.length > 0 || s.summary.length > 0));
  const legacyPalaces = legacySections.filter((s) => isPalaceSectionTitle(s.title));
  const legacyTextSections = legacySections.filter((s) => !isPalaceSectionTitle(s.title));

  const legacyPalaceSections: PalaceSection[] = legacyPalaces.map((s) => ({
    title: s.title,
    starAnalyses: [],
    summary: [{ text: s.content, source: s.source }],
  }));

  const palacesToRender: PalaceSection[] = structuredPalaces.length > 0 ? structuredPalaces : legacyPalaceSections;

  const overviewId = "eastern-overview";
  const sectionIdForTitle = (title: string) => `section-${slugify(title)}`;
  const palacesId = "eastern-palaces";
  const daiVanId = "eastern-daivan";
  const tieuVanId = "eastern-tieuvan";

  const topics = (result.topics || []).filter((topic) => topic?.id && topic?.label && topic?.target);
  const topicTargetToId = (target: string) => {
    const normalized = target.trim();
    if (normalized.toLowerCase() === "đại vận".toLowerCase()) return daiVanId;
    if (normalized.toLowerCase() === "tiểu vận".toLowerCase()) return tieuVanId;
    const matchingSection = legacyTextSections.find((s) => s.title.trim().toLowerCase() === normalized.toLowerCase());
    if (matchingSection) return sectionIdForTitle(matchingSection.title);
    return `palace-${slugify(normalized)}`;
  };

  const onTopicClick = (target: string) => {
    const id = topicTargetToId(target);
    if (id.startsWith("palace-")) {
      setOpenPalaceId(id);
      // Auto mở palace collapse
      setTimeout(() => {
        const palaceElement = document.getElementById(id);
        if (palaceElement && palaceElement.tagName === 'DETAILS') {
          (palaceElement as HTMLDetailsElement).open = true;
        }
      }, 100);
    }
    focusSection(id);
    requestAnimationFrame(() => scrollToId(id));
  };

  const navItems: Array<{ id: string; label: string; hidden?: boolean }> = [
    { id: overviewId, label: "Luận giải tổng quan" },
    { id: palacesId, label: "Luận giải 12 cung", hidden: palacesToRender.length === 0 },
    // {
    //   id: daiVanId,
    //   label: "Đại vận",
    //   hidden: !((result.daiVan && result.daiVan.length) || (result.daiVanSections && result.daiVanSections.length)),
    // },
    // {
    //   id: tieuVanId,
    //   label: "Tiểu vận",
    //   hidden: !((result.tieuVan && result.tieuVan.length) || (result.tieuVanSections && result.tieuVanSections.length)),
    // },
  ].filter((x) => !x.hidden);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-2">Chọn mục để xem nhanh</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQaOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
          >
            <MessageCircle className="h-4 w-4" />
            Hỏi đáp
          </button>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToId(item.id)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {item.label}
            </button>
          ))}
        </div>

        {topics.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Chủ đề</p>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onTopicClick(topic.target)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={qaOpen} onOpenChange={setQaOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <div className="p-6">
            <SheetHeader>
              <SheetTitle>Hỏi đáp về Tử Vi</SheetTitle>
              <SheetDescription>Trợ lý sẽ dựa trên toàn bộ kết quả lá số vừa luận giải để trả lời.</SheetDescription>
            </SheetHeader>

            <div className="mt-4" style={{ height: "calc(100dvh - 10rem)" }}>
              <ChatPanel
                moduleKey={resolvedQaModuleKey}
                storageKeySuffix={qaSessionKey ?? lastReadingId ?? "latest"}
                contextJson={
                  qaContextJson ?? {
                    readingId: lastReadingId,
                    optionId: selectedOption,
                    profile,
                    result,
                  }
                }
                className="flex h-full flex-col"
                heightClassName="flex-1"
                showQuickActions
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <details
        id={overviewId}
        className={`rounded-2xl border border-primary/20 bg-card p-5 shadow-sm scroll-mt-24 transition-colors ${
          highlightId === overviewId ? "ring-2 ring-primary/30" : ""
        }`}
        open
      >
        <summary className="cursor-pointer select-none list-none">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gradient-primary">Luận giải tổng quan</h2>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 p-4 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" animate="default" loop/>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                <span className="font-semibold">Lưu ý quan trọng:</span> Phân tích này mang tính chất tham khảo và tự khám phá, giúp bạn hiểu rõ hơn về bản thân. Đây không phải là dự đoán tương lai hay lời khuyên chuyên môn.
              </p>
            </div>
          </div>
          {splitParagraphs(result.overview || "").map((p, i) => (
            <div key={i}>{renderMarkdown(p)}</div>
          ))}
        </div>

        {result.overviewItems && result.overviewItems.length > 0 && (
          <details className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm scroll-mt-24 transition-colors" open>
            <summary className="cursor-pointer select-none list-none">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground">Thông tin chi tiết</h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </summary>
            <div className="mt-4 space-y-3">
              {result.overviewItems.map((item, i) => (
                <div key={i} className={`rounded-xl border border-border bg-background p-3 ${getItemTypeStyles(item.type)}`}>
                  {item.heading && (
                    <div className="flex flex-wrap gap-1 items-center">
                      {item.type && <span className="text-sm">{getItemTypeIcon(item.type)}</span>}
                      <p className="text-sm font-semibold text-foreground">{item.heading}:</p>
                      <div className="text-sm">{renderMarkdown(item.text)}</div>
                    </div>
                  )}
                  {!item.heading && (
                    <div className="flex gap-2 items-start">
                      {item.type && <span className="text-sm mt-1">{getItemTypeIcon(item.type)}</span>}
                      <div className="text-sm flex-1">{renderMarkdown(item.text)}</div>
                    </div>
                  )}
                  {item.source && <p className="mt-2 text-xs italic text-muted-foreground/70 text-right">{item.source}</p>}
                </div>
              ))}
            </div>
          </details>
        )}
      </details>

      {legacyTextSections.length > 0 && (
        <div className="mt-4 space-y-3">
          {legacyTextSections.map((section) => {
            const id = sectionIdForTitle(section.title);
            return (
              <details
                key={id}
                id={id}
                className={`rounded-2xl border border-border bg-card p-5 shadow-sm scroll-mt-24 transition-colors ${
                  highlightId === id ? "ring-2 ring-primary/30" : ""
                }`}
              >
                <summary className="cursor-pointer select-none list-none">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </summary>
                <div className="mt-3 space-y-3">
                  {splitParagraphs(section.content).map((p, i) => (
                    <div key={i}>{renderMarkdown(p)}</div>
                  ))}
                  {section.source && <p className="text-xs italic text-muted-foreground/70">{section.source}</p>}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {palacesToRender.length > 0 && (
        <div
          id={palacesId}
          className={`mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm scroll-mt-24 transition-colors ${
            highlightId === palacesId ? "ring-2 ring-primary/30" : ""
          }`}
        >
          <h2 className="text-lg font-semibold text-foreground">Luận giải 12 cung</h2>
         <div className="rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 p-4 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-sm mt-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" animate="default" loop/>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                <span className="font-semibold">Lưu ý quan trọng:</span> Phân tích này mang tính chất tham khảo và tự khám phá, giúp bạn hiểu rõ hơn về bản thân. Đây không phải là dự đoán tương lai hay lời khuyên chuyên môn.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {palacesToRender.map((palace) => {
              const palaceId = `palace-${slugify(palace.title)}`;
              return (
                <details
                  key={palaceId}
                  id={palaceId}
                  className={`rounded-xl border border-border bg-background p-4 scroll-mt-24 transition-colors ${
                    highlightId === palaceId ? "ring-2 ring-primary/30" : ""
                  }`}
                  open={false}
                  onToggle={(e) => {
                    const el = e.currentTarget as HTMLDetailsElement;
                    if (el.open) setOpenPalaceId(palaceId);
                  }}
                >
                  <summary className="cursor-pointer select-none list-none">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{palace.title}</p>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {/* Phân tích từng sao */}
                    {palace.starAnalyses && palace.starAnalyses.length > 0 && (
                      <div className="space-y-3">
                        {palace.starAnalyses.map((analysis, i) => (
                          <div key={i} className="rounded-lg border border-border/70 bg-card p-3">
                            {analysis.heading && (
                              <div className="flex flex-wrap gap-1 items-center mb-2">
                                <p className="text-sm font-semibold text-foreground">{analysis.heading}</p>
                              </div>
                            )}
                            <div className="text-sm">{renderMarkdown(analysis.text)}</div>
                            {analysis.source && <p className="mt-2 text-xs italic text-muted-foreground/70 text-right">{analysis.source}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Nhận định tổng hợp */}
                    {palace.summary && palace.summary.length > 0 && (
                      <div className="space-y-3">
                        {palace.summary.map((item, i) => (
                          <div key={i} className={`rounded-lg border border-border/70 bg-card p-3 ${getItemTypeStyles(item.type)}`}>
                            <div className="flex gap-2 items-start">
                              {item.type && <span className="text-sm mt-1">{getItemTypeIcon(item.type)}</span>}
                              <div className="flex-1">{renderMarkdown(item.text)}</div>
                            </div>
                            {item.source && <p className="mt-2 text-xs italic text-muted-foreground/70 text-right">{item.source}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
