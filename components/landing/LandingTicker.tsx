"use client";

import { Marquee } from "@/components/landing/shared";
import { useI18n } from "@/i18n/provider";

export default function LandingTicker() {
  const { t } = useI18n();
  return (
    <Marquee
      items={[
        t("landing.hero.freeForEveryone"),
        t("landing.timetable.eyebrow"),
        t("landing.fairness.eyebrow"),
        t("landing.stats.lecturers"),
        t("landing.timetable.title"),
      ]}
    />
  );
}

