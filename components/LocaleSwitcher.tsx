"use client";

import { LOCALE_META, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Two-state segmented toggle (EN | VI) — with only two locales a dropdown is an extra click.
// If a third locale is ever added this still renders one segment per locale.
const STYLES = {
  app: {
    root: "border-[var(--paper-200)] bg-white/80 shadow-sm",
    ring: "focus-visible:ring-[var(--brand-400)]",
    on: "bg-[var(--brand-500)] text-white",
    off: "text-[var(--ink-600)] hover:bg-[var(--paper-100)]",
  },
  marketing: {
    root: "border-blue-200 bg-white/80 shadow-sm",
    ring: "focus-visible:ring-blue-400",
    on: "bg-blue-950 text-white",
    off: "text-blue-950 hover:bg-blue-50",
  },
  // Dark glass pill for Mochy surfaces (docs/DESIGN.md §8).
  mochy: {
    root: "m-glass border-transparent",
    ring: "focus-visible:ring-[var(--m-focus)]",
    on: "bg-[var(--m-fg)] text-[var(--m-bg)] hover:bg-[var(--m-fg)]",
    off: "text-[var(--m-fg2)] hover:bg-[var(--m-glass-hi)] hover:text-[var(--m-fg)]",
  },
} as const;

export function LocaleSwitcher({ variant = "app" }: { variant?: keyof typeof STYLES }) {
  const { locale, setLocale, t } = useI18n();
  const style = STYLES[variant];

  return (
    <div
      role="radiogroup"
      aria-label={t("language.label")}
      className={cn(
        "inline-flex min-h-9 items-center gap-0.5 rounded-full border p-0.5",
        style.root
      )}
    >
      {SUPPORTED_LOCALES.map((option) => {
        const active = option === locale;
        return (
          <Button
            key={option}
            type="button"
            variant="ghost"
            size="sm"
            role="radio"
            aria-checked={active}
            aria-label={LOCALE_META[option].nativeLabel}
            title={LOCALE_META[option].nativeLabel}
            onClick={() => !active && setLocale(option as Locale)}
            className={cn(
              "h-auto min-w-9 rounded-full px-2.5 py-1 text-xs font-bold",
              style.ring,
              active ? style.on : style.off
            )}
          >
            {option.toUpperCase()}
          </Button>
        );
      })}
    </div>
  );
}
