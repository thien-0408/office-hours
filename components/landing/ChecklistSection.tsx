"use client";

import { NEO_DARK } from "@/components/landing/shared";
import { useI18n } from "@/i18n/provider";

export default function ChecklistSection() {
  const { t } = useI18n();
  const rows = [
    t("landing.checklist.row1"), t("landing.checklist.row2"), t("landing.checklist.row3"), t("landing.checklist.row4"),
    t("landing.checklist.row5"), t("landing.checklist.row6"), t("landing.checklist.row7"), t("landing.checklist.row8"),
  ];
  const stickies = [
    { text: t("landing.checklist.sticky1"), row: 2 },
    { text: t("landing.checklist.sticky2"), row: 6 },
  ];
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
        <div className={`relative w-full overflow-hidden rounded-3xl bg-[var(--po-text-primary)] p-5 -rotate-1 md:flex-1 ${NEO_DARK}`}>
          <div className="flex flex-col gap-2.5">
            {rows.map((row, i) => {
              const sticky = stickies.find((s) => s.row === i);
              return (
                <div key={row} className="relative flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3">
                  <span className="h-4 w-4 shrink-0 rounded-[4px] border border-white/25" aria-hidden="true" />
                  <span className="text-[12.5px] font-medium text-white/70">{row}</span>
                  {sticky ? (
                    <span className="absolute -bottom-2 left-10 z-10 rotate-[-2deg] rounded-md bg-[var(--po-accent)] px-2.5 py-1 text-[10px] font-bold text-[var(--po-text-primary)] shadow-lg">
                      {sticky.text}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full text-center md:flex-1 md:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-secondary)]">
            {t("landing.checklist.eyebrow")}
          </p>
          <h2 className="mt-3 max-w-[16ch] text-balance text-[clamp(26px,3.4vw,38px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-[var(--po-text-primary)] mx-auto md:mx-0">
            {t("landing.checklist.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--po-text-primary)]/70 md:mx-0">
            {t("landing.checklist.body")}
          </p>
        </div>
      </div>
    </section>
  );
}
