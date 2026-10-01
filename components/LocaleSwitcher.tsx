"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { LOCALE_META, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import { useI18n } from "@/i18n/provider";

export function LocaleSwitcher({ variant = "app" }: { variant?: "app" | "marketing" }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const isMarketing = variant === "marketing";
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("language.switchTo")}
        onClick={() => setOpen((value) => !value)}
        className={isMarketing
          ? "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3 text-xs font-bold text-blue-950 shadow-sm transition hover:border-blue-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          : "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--paper-200)] bg-white/80 px-3 text-xs font-bold text-[var(--ink-700)] shadow-sm transition hover:border-[var(--brand-300)] hover:text-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-400)]"}
      >
        <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{locale.toUpperCase()}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-label={t("language.label")} className="absolute right-0 z-50 mt-2 min-w-36 rounded-xl border border-[var(--paper-200)] bg-white p-1.5 shadow-xl">
          {SUPPORTED_LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={locale === option}
              onClick={() => {
                setOpen(false);
                setLocale(option as Locale);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[var(--ink-700)] transition hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-400)]"
            >
              <span>{LOCALE_META[option].nativeLabel}</span>
              {locale === option && <Check className="h-3.5 w-3.5 text-[var(--brand-600)]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

