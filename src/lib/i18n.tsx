import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";

import {
  DEFAULT_LANG,
  FALLBACK_LANG,
  STORAGE_KEY,
  interpolate,
  translations,
  type InterpolationValues,
  type Lang,
  type TranslationDict,
} from "@/lib/i18n-dict.ts";

export type { Lang } from "@/lib/i18n-dict.ts";

export type TranslationKey = keyof typeof translations;

function getInitialLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "vi" || stored === "en") return stored;
  return DEFAULT_LANG;
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey | string, values?: InterpolationValues) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getInitialLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, values?: InterpolationValues): string => {
      const dict = translations as unknown as TranslationDict;
      const entry = dict[key];
      if (!entry) return interpolate(String(key), values);

      const text = entry[lang] ?? entry[FALLBACK_LANG] ?? String(key);
      return interpolate(text, values);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
