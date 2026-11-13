"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { MOCHY_SPRING } from "./motion";
import { useI18n } from "@/i18n/provider";
import type { MessageKey } from "@/i18n";
import { MOCHY_THEMES, THEME_COOKIE, type MochyTheme } from "./theme";

const OPTIONS: Record<MochyTheme, { icon: typeof Sun; label: MessageKey }> = {
  system: { icon: Monitor, label: "theme.system" },
  light: { icon: Sun, label: "theme.light" },
  dark: { icon: Moon, label: "theme.dark" },
};

// Three-way segmented pill (system / light / dark) in the same shape as LocaleSwitcher.
// Icons are allowed here: compact control, labels are in aria-label and title.
// The filled highlight slides to the new choice on Mochy's tab-indicator spring.
export function ThemeSwitcher({ value, onChange }: { value: MochyTheme; onChange: (theme: MochyTheme) => void }) {
  const { t } = useI18n();
  const layoutId = useId();

  function choose(theme: MochyTheme) {
    if (theme === value) return;
    document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    onChange(theme);
  }

  return (
    <div role="radiogroup" aria-label={t("theme.label")} className="m-glass inline-flex h-9 items-center gap-0.5 rounded-full p-0.5">
      {MOCHY_THEMES.map((theme) => {
        const { icon: Icon, label } = OPTIONS[theme];
        const active = theme === value;
        return (
          <button
            key={theme}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(label)}
            title={t(label)}
            onClick={() => choose(theme)}
            className={`m-press relative grid h-8 w-8 cursor-pointer place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[var(--m-focus)] ${
              active ? "text-[var(--m-bg)]" : "text-[var(--m-fg2)] hover:bg-[var(--m-glass-hi)] hover:text-[var(--m-fg)]"
            }`}
          >
            {active && (
              <motion.span layoutId={layoutId} transition={MOCHY_SPRING.indicator} className="absolute inset-0 rounded-full bg-[var(--m-fg)]" />
            )}
            <Icon className="relative h-4 w-4" strokeWidth={2.2} />
          </button>
        );
      })}
    </div>
  );
}
