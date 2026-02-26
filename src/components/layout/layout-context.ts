import type React from "react";

import { createContext, useContext } from "react";

export type LayoutSeoConfig = {
  titleKey: string;
  descriptionKey: string;
  path?: string;
};

export type LayoutConfig = {
  seo?: LayoutSeoConfig;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  disableContentWrapper?: boolean;
  top?: React.ReactNode;
  showUserContextBanner?: boolean;
  userContextBannerClassName?: string;
  showAdvisoryNotice?: boolean;
  advisoryNoticeCompact?: boolean;
  advisoryNoticeClassName?: string;
};

type LayoutContextValue = {
  config: LayoutConfig;
  setConfig: (next: LayoutConfig) => void;
  resetConfig: () => void;
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  contentClassName: "container mx-auto px-4 py-6 md:py-10 lg:py-16",
  disableContentWrapper: false,
  showUserContextBanner: false,
  showAdvisoryNotice: false,
  advisoryNoticeCompact: false,
};

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayoutContext must be used within LayoutConfigProvider");
  return ctx;
}
