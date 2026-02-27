import type { Lang } from "@/lib/i18n-dict.ts";

export function getLocale(lang: Lang): string {
  return lang === "vi" ? "vi-VN" : "en-US";
}

export function formatDateTime(
  input: string | number | Date,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat(getLocale(lang), {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date);
}

export function formatNumber(input: number, lang: Lang, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(lang), options).format(input);
}
