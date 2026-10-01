"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { LOCALE_META, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ variant = "app" }: { variant?: "app" | "marketing" }) {
  const { locale, setLocale, t } = useI18n();
  const isMarketing = variant === "marketing";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language.switchTo")}
        className={cn(
          "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border bg-white/80 px-3 text-xs font-bold shadow-sm outline-none transition focus-visible:ring-2",
          isMarketing
            ? "border-blue-200 text-blue-950 hover:border-blue-400 hover:bg-white focus-visible:ring-blue-400"
            : "border-[var(--paper-200)] text-[var(--ink-700)] hover:border-[var(--brand-300)] hover:text-[var(--brand-700)] focus-visible:ring-[var(--brand-400)]"
        )}
      >
        <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{locale.toUpperCase()}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={t("language.label")} className="min-w-36">
        {SUPPORTED_LOCALES.map((option) => (
          <DropdownMenuItem
            key={option}
            className="justify-between gap-3 text-xs font-semibold"
            onClick={() => setLocale(option as Locale)}
          >
            <span>{LOCALE_META[option].nativeLabel}</span>
            {locale === option && <Check className="h-3.5 w-3.5 text-[var(--brand-600)]" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
