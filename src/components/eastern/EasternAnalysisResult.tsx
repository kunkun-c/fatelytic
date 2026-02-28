import React from "react";
import EasternUploadResult, { type EasternResult } from "@/components/eastern/EasternUploadResult";

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

export default function EasternAnalysisResult(props: Props) {
  return <EasternUploadResult {...props} />;
}
