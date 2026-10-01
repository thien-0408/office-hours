"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LOCALE_COOKIE, LOCALE_META, type Locale, type MessageKey, messages, translate } from "@/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (nextLocale === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = LOCALE_META[nextLocale].htmlLang;
    setLocaleState(nextLocale);
    window.location.reload();
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => translate(locale, key, values),
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function useMessages() {
  const { locale } = useI18n();
  return messages[locale];
}

