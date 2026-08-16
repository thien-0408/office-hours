"use client";

import { useState } from "react";
import { NEO_LIGHT } from "@/components/landing/shared";

const FAQS = [
  {
    q: "Who is OfficeHours for?",
    a: "Any student or lecturer at a participating institution. Students book slots; lecturers set availability and confirm requests; admins manage semesters and department rollout.",
  },
  {
    q: "Is it really free?",
    a: "Yes — free for students and lecturers. There's no paid tier, no card required, no seat limit.",
  },
  {
    q: "How does conflict checking work?",
    a: "Every open slot is already matched against your imported class schedule and your lecturer's teaching schedule, so what you see is what's actually free — enforced at the database level, not just in the app.",
  },
  {
    q: "What happens if a slot fills up?",
    a: "You join a waitlist. Offers go out by a published, logged policy — not by who refreshed fastest — and you can see your position at any time.",
  },
  {
    q: "Can my whole department switch over?",
    a: "Yes. Admins can bulk-import a department's official schedule export, and every lecturer keeps their own availability rules from day one.",
  },
  {
    q: "Do I need to install anything?",
    a: "No — it runs in the browser on desktop or mobile. Nothing to download for students or lecturers.",
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faqs" className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className={`rounded-3xl bg-[var(--po-accent)] p-6 rotate-1 md:p-10 ${NEO_LIGHT}`}>
        <h2 className="text-[clamp(28px,3.6vw,40px)] font-extrabold tracking-[-0.01em] text-[var(--po-text-primary)]">
          FAQs
        </h2>

        <div className="mt-6 flex flex-col">
          {FAQS.map((item, i) => {
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
