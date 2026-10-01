export const LOCALE_COOKIE = "NEXT_LOCALE";

export const SUPPORTED_LOCALES = ["en", "vi"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; nativeLabel: string; htmlLang: string }> = {
  en: { label: "English", nativeLabel: "English", htmlLang: "en-US" },
  vi: { label: "Vietnamese", nativeLabel: "Tiếng Việt", htmlLang: "vi-VN" },
};

export function resolveLocale(value: string | undefined | null): Locale {
  return value === "vi" ? "vi" : "en";
}

