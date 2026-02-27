import { ChevronDown, MessageCircle } from "@/components/ui/icons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ChatPanel from "@/components/ChatPanel";
import React from "react";

type TopicItem = { id: string; label: string; target: string };

type SectionItem = { title: string; content: string; source?: string };

type PalaceSection = {
  title: string;
  items: Array<{ text: string; source?: string }>;
};

type PeriodSection = {
  label: string;
  items: Array<{ text: string; source?: string }>;
};

export type EasternResult = {
  overview: string;
  sections: SectionItem[];
  overviewQuotes?: string[];
  detailSections?: SectionItem[];
  daiVan?: string[];
  tieuVan?: string[];
  overviewItems?: Array<{ heading?: string; text: string; source?: string }>;
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
}: Props) {
  const legacySections = (result.sections || []).filter((s) => s?.title && s?.content);
  const structuredPalaces = (result.palaceSections || []).filter((s) => s?.title && Array.isArray(s.items) && s.items.length > 0);
  const legacyPalaces = legacySections.filter((s) => isPalaceSectionTitle(s.title));
  const legacyTextSections = legacySections.filter((s) => !isPalaceSectionTitle(s.title));

  const legacyPalaceSections: PalaceSection[] = legacyPalaces.map((s) => ({
    title: s.title,
    items: [{ text: s.content, source: s.source }],
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
    if (id.startsWith("palace-")) setOpenPalaceId(id);
    focusSection(id);
    requestAnimationFrame(() => scrollToId(id));
  };

  const navItems: Array<{ id: string; label: string; hidden?: boolean }> = [
    { id: overviewId, label: "Luận giải tổng quan" },
    { id: palacesId, label: "Bình giải 12 cung", hidden: palacesToRender.length === 0 },
    {
      id: daiVanId,
      label: "Đại vận",
      hidden: !((result.daiVan && result.daiVan.length) || (result.daiVanSections && result.daiVanSections.length)),
    },
    {
      id: tieuVanId,
      label: "Tiểu vận",
      hidden: !((result.tieuVan && result.tieuVan.length) || (result.tieuVanSections && result.tieuVanSections.length)),
    },
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
                moduleKey="eastern"
                storageKeySuffix={qaSessionKey ?? lastReadingId ?? "latest"}
                contextJson={{
                  readingId: lastReadingId,
                  optionId: selectedOption,
                  profile,
                  result,
                }}
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
          {splitParagraphs(result.overview || "").map((p, i) => (
            <div key={i}>{renderMarkdown(p)}</div>
          ))}
        </div>

        {result.overviewItems && result.overviewItems.length > 0 && (
          <div className="mt-4 space-y-4">
            {result.overviewItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-4">
                {item.heading && <p className="text-sm font-semibold text-foreground">{item.heading}</p>}
                <div className="mt-2">{renderMarkdown(item.text)}</div>
                {item.source && <p className="mt-2 text-xs italic text-muted-foreground/70">{item.source}</p>}
              </div>
            ))}
          </div>
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
          <h2 className="text-lg font-semibold text-foreground">Bình giải 12 cung</h2>
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
                    {palace.items.map((it, i) => (
                      <div key={i} className="rounded-lg border border-border/70 bg-card p-3">
                        <div>{renderMarkdown(it.text)}</div>
                        {it.source && <p className="mt-2 text-xs italic text-muted-foreground/70">{it.source}</p>}
                      </div>
                    ))}
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
