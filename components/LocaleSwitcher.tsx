"use client";

import { LOCALE_META, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Two-state segmented toggle (EN | VI) — with only two locales a dropdown is an extra click.
// If a third locale is ever added this still renders one segment per locale.
export function LocaleSwitcher({ variant = "app" }: { variant?: "app" | "marketing" }) {
  const { locale, setLocale, t } = useI18n();
  const isMarketing = variant === "marketing";

  return (
    <div
      role="radiogroup"
      aria-label={t("language.label")}
      className={cn(
        "inline-flex min-h-9 items-center gap-0.5 rounded-full border bg-white/80 p-0.5 shadow-sm",
        isMarketing ? "border-blue-200" : "border-[var(--paper-200)]"
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
              isMarketing
                ? "focus-visible:ring-blue-400"
                : "focus-visible:ring-[var(--brand-400)]",
              active
                ? isMarketing
                  ? "bg-blue-950 text-white"
                  : "bg-[var(--brand-500)] text-white"
                : isMarketing
                  ? "text-blue-950 hover:bg-blue-50"
                  : "text-[var(--ink-600)] hover:bg-[var(--paper-100)]"
            )}
          >
            {option.toUpperCase()}
          </Button>
        );
      })}
    </div>
  );
}
