"use client";

import { useI18n } from "@/i18n/provider";

interface StepCard {
  n: string;
  title: string;
  body: string;
}

const CARDS: StepCard[] = [
  { n: "01", title: "Create your profile", body: "One form. Department, courses, and your usual hours." },
  { n: "02", title: "Set weekly availability", body: "Recurring hours plus one-off exceptions when plans change." },
  { n: "03", title: "Students request a slot", body: "They see only what's actually open — already checked for you." },
  { n: "04", title: "We check for conflicts", body: "Every request is matched against class schedules automatically." },
  { n: "05", title: "You confirm, it's live", body: "One tap to confirm or decline. The calendar updates instantly." },
];

const ROTATIONS = ["-rotate-1", "rotate-1", "-rotate-1", "rotate-1", "-rotate-1"];

export default function ProcessTimeline() {
  const { t } = useI18n();
  const cards: StepCard[] = [
    { n: "01", title: t("landing.process.step1.title"), body: t("landing.process.step1.body") },
    { n: "02", title: t("landing.process.step2.title"), body: t("landing.process.step2.body") },
    { n: "03", title: t("landing.process.step3.title"), body: t("landing.process.step3.body") },
    { n: "04", title: t("landing.process.step4.title"), body: t("landing.process.step4.body") },
    { n: "05", title: t("landing.process.step5.title"), body: t("landing.process.step5.body") },
  ];
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-secondary)]">
          {t("landing.process.eyebrow")}
        </p>
        <h2 className="mx-auto mt-3 max-w-[20ch] text-balance text-[clamp(26px,3.4vw,38px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-[var(--po-text-primary)]">
          {t("landing.process.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--po-text-primary)]/70">
          {t("landing.process.body")}
        </p>
      </div>

      {/* Neo-brutalist hard-shadow card recipe, lifted from app/page.tsx's
          value-prop cards (docs/DESIGN.md §1.1) — border-2 border-blue-950 +
          a flat offset shadow, no blur, plus a slight per-card rotation that
          settles to 0 on hover. Sized up from that page's version per
          explicit request. */}
      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={card.n}
            className={`relative ${ROTATIONS[i]} transition-transform hover:-translate-y-1 hover:rotate-0`}
          >
            <div className="rounded-[20px] border-2 border-blue-950 bg-white px-8 py-10 shadow-[8px_8px_0_0_#0b1b49]">
              <span className="inline-flex h-11 w-11 rotate-[-3deg] items-center justify-center rounded-full border-2 border-blue-950 bg-blue-600 font-mono text-[13px] font-bold text-white">
                {card.n}
              </span>
              <h3 className="mt-5 text-[19px] font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-slate-600">{card.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
