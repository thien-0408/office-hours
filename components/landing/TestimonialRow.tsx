"use client";

import Image from "next/image";
import { memojiSrc } from "@/lib/avatar";
import { NEO_LIGHT } from "@/components/landing/shared";
import { useI18n } from "@/i18n/provider";

const ROTATIONS = ["-rotate-1", "rotate-1", "-rotate-1", "rotate-1"];

export default function TestimonialRow() {
  const { t } = useI18n();
  const testimonials = [
    { quote: t("landing.testimonial.quote1"), name: "Priya Nair", role: t("landing.testimonial.role1"), seed: "testi-1" },
    { quote: t("landing.testimonial.quote2"), name: "Marcus Webb", role: t("landing.testimonial.role2"), seed: "testi-2" },
    { quote: t("landing.testimonial.quote3"), name: "Dr. Elena Ruiz", role: t("landing.testimonial.role3"), seed: "testi-3" },
    { quote: t("landing.testimonial.quote4"), name: "Prof. Sam Okafor", role: t("landing.testimonial.role4"), seed: "testi-4" },
  ];
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((testimonial, i) => (
          <div
            key={testimonial.name}
            className={`flex flex-col justify-between rounded-2xl bg-[var(--po-surface)] p-5 transition-transform hover:-translate-y-0.5 hover:rotate-0 ${ROTATIONS[i]} ${NEO_LIGHT}`}
          >
            <span className="text-[26px] font-black leading-none text-[var(--po-accent)]" style={{ WebkitTextStroke: "1.5px var(--po-text-primary)" }} aria-hidden="true">
              &rdquo;
            </span>
            <p className="mt-2 text-[13.5px] font-semibold leading-snug text-[var(--po-text-primary)]">{testimonial.quote}</p>
            <div className="mt-5 flex items-center gap-2.5">
              <Image src={memojiSrc(testimonial.seed)} alt="" width={32} height={32} className="rounded-full" />
              <div>
                <p className="text-[12px] font-bold text-[var(--po-text-primary)]">{testimonial.name}</p>
                <p className="text-[11px] text-[var(--po-text-secondary)]">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
