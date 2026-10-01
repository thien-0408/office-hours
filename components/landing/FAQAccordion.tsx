"use client";

import { useState } from "react";
import { NEO_LIGHT } from "@/components/landing/shared";
import { useI18n } from "@/i18n/provider";

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useI18n();
  const faqs = [
    { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
    { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
    { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
    { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
    { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
    { q: t("landing.faq.q6"), a: t("landing.faq.a6") },
  ];

  return (
    <section id="faqs" className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className={`rounded-3xl bg-[var(--po-accent)] p-6 rotate-1 md:p-10 ${NEO_LIGHT}`}>
        <h2 className="text-[clamp(28px,3.6vw,40px)] font-extrabold tracking-[-0.01em] text-[var(--po-text-primary)]">
          FAQs
        </h2>

        <div className="mt-6 flex flex-col">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-t border-[var(--po-text-primary)]/15 first:border-t-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-[14px] font-bold text-[var(--po-text-primary)]">{item.q}</span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--po-text-primary)] text-[var(--po-accent)] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                {isOpen ? (
                  <p className="pb-4 pr-10 text-[13px] leading-relaxed text-[var(--po-text-primary)]/75">{item.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
