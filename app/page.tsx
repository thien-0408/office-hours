import type { Metadata } from "next";
import { PROJECT_ONE_TOKENS } from "@/components/landing/tokens";
import { satoshi } from "@/components/landing/fonts";
import LandingHero from "@/components/landing/LandingHero";
import ChecklistSection from "@/components/landing/ChecklistSection";
import TimetablePreview from "@/components/landing/TimetablePreview";
import ValueGrid from "@/components/landing/ValueGrid";
import { Marquee } from "@/components/landing/shared";
import ProcessTimeline from "@/components/landing/ProcessTimeline";
import PricingSection from "@/components/landing/PricingSection";
import ComparisonTable from "@/components/landing/ComparisonTable";
import StatsBento from "@/components/landing/StatsBento";
import FairnessSection from "@/components/landing/FairnessSection";
import TestimonialRow from "@/components/landing/TestimonialRow";
import FAQAccordion from "@/components/landing/FAQAccordion";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "OfficeHours — Office hours, handled.",
  description: "A booking system that checks every slot against your real class schedule. No email chase, no double-books.",
};

const TICKER = ["Free for students", "Conflict-checked", "Fair waitlist", "Senior-built", "Live on your campus"];

export default function LandingPage() {
  return (
    <div className={`flex flex-1 flex-col bg-[var(--po-bg)] ${satoshi.className}`} style={PROJECT_ONE_TOKENS}>
      <LandingHero />
      <ChecklistSection />
      <TimetablePreview />
      <ValueGrid />
      <Marquee items={TICKER} />
      <ProcessTimeline />
      <PricingSection />
      <ComparisonTable />
      <StatsBento />
      <FairnessSection />
      <TestimonialRow />
      <FAQAccordion />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
