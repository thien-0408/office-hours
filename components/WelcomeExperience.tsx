"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Lock,
  LucideIcon,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoWithText } from "@/components/LogoWithText";
import FacultyOfficeDiorama from "@/components/FacultyOfficeDiorama";
import { TimetableShowcaseDemo } from "@/components/TimetableShowcaseDemo";

// /welcome — Academic Experience Tour & Faculty Hub
// Sourced from docs/DESIGN.md & academic platform requirements.
// Features a smooth 3D CatmullRom camera walkthrough inside Faculty Room 304,
// followed by an interactive Academic Role Matrix and AAO Conflict Matcher.

const SCENES = [
  {
    eyebrow: "Faculty Office 304 · Academic Advising",
    title: "Walk into Room 304 before you ever send an email.",
    body: "Every open office-hour slot here is pre-synchronized with university timetables, teaching loads, and faculty research blocks before you ever see it.",
    badge: "Faculty Suite 304",
  },
  {
    eyebrow: "100% Conflict-Free Scheduling",
    title: "No inbox back-and-forth. Zero double-booking.",
    body: "The live schedule on this desk is cross-referenced in real-time with your imported AAO class schedule — zero guessing which hour is actually free.",
    badge: "AAO 07:30 AM Sync",
  },
  {
    eyebrow: "Verifiable Fairness Engine",
    title: "When slots are scarce, they're shared by published policy.",
    body: "First-come, priority-by-need, or round-robin — every waitlist allocation is calculated by a published, reproducible algorithm with audit logs.",
    badge: "Published Algorithm",
  },
  {
    eyebrow: "Meaningful Academic Connection",
    title: "Focus on the conversation, not the scheduling friction.",
    body: "Book your slot in one click, get instant confirmation, and show up knowing your faculty advisor is prepared and the room is yours.",
    badge: "1-Click Guaranteed",
  },
];

const SCENE_COUNT = SCENES.length;
const FADE_WIDTH = 0.06;

function sceneOpacity(progress: number, index: number): number {
  const start = index / SCENE_COUNT;
  const end = (index + 1) / SCENE_COUNT;
  if (progress < start - FADE_WIDTH || progress > end + FADE_WIDTH) return 0;
  if (progress < start) return (progress - (start - FADE_WIDTH)) / FADE_WIDTH;
  if (progress > end) return 1 - (progress - end) / FADE_WIDTH;
  return 1;
}

type RoleTab = "STUDENT" | "LECTURER" | "ADMIN";

interface RoleFeature {
  title: string;
  desc: string;
  icon: LucideIcon;
}

const ROLE_FEATURES: Record<RoleTab, { role: string; subtitle: string; features: RoleFeature[] }> = {
  STUDENT: {
    role: "For Students & Advisees",
    subtitle: "Eliminate the anxiety of unanswered emails and missed advising deadlines.",
    features: [
      {
        title: "AAO Timetable Auto-Pruning",
        desc: "Upload your class schedule PDF once. Clashing slots disappear automatically from every professor's calendar.",
        icon: CalendarCheck,
      },
      {
        title: "One-Click Instant Booking",
        desc: "Request a slot with your topic and optional project group members in seconds without waiting for email replies.",
        icon: Sparkles,
      },
      {
        title: "Transparent Queue Position",
        desc: "When a popular slot is full, join the waitlist and track your live status governed by published allocation rules.",
        icon: Users,
      },
    ],
  },
  LECTURER: {
    role: "For Faculty Advisors & Professors",
    subtitle: "Reclaim your weekly research hours and stop managing appointments in your head.",
    features: [
      {
        title: "Weekly Availability Rules",
        desc: "Set recurring office hours once. Add one-off exceptions or busy blocks on demand when conferences occur.",
        icon: Clock,
      },
      {
        title: "Teaching Schedule Shield",
        desc: "Teaching assignments and lab shifts are automatically respected — no double-booked consultation hours.",
        icon: ShieldCheck,
      },
      {
        title: "One-Tap Review & Attendance",
        desc: "Accept or decline requests in a tap. Mark completed sessions, record notes, and track no-shows effortlessly.",
        icon: CheckCircle2,
      },
    ],
  },
  ADMIN: {
    role: "For Department Heads & Academic Affairs",
    subtitle: "Full departmental transparency, equity auditing, and schedule synchronization.",
    features: [
      {
        title: "Batch AAO Schedule Ingestion",
        desc: "Import university-wide timetable CSVs/PDFs with background parsing and zero data loss.",
        icon: Layers,
      },
      {
        title: "Allocation Policy Tuning",
        desc: "Configure weighted scoring (Urgency vs. Seniority vs. FCFS) and compare policies side-by-side on live cohorts.",
        icon: ShieldCheck,
      },
      {
        title: "Verifiable Fairness Logs",
        desc: "Every waitlist decision is logged with cryptographic seed hashes and policy parameters for complete accreditation audits.",
        icon: Lock,
      },
    ],
  },
};

export default function WelcomeExperience() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollHintRef = useRef<HTMLDivElement | null>(null);
  const [activeRole, setActiveRole] = useState<RoleTab>("STUDENT");

  const handleProgress = useCallback((progress: number) => {
    sceneRefs.current.forEach((el, i) => {
      if (!el) return;
      const opacity = sceneOpacity(progress, i);
      el.style.opacity = String(opacity);
      el.style.transform = `translateY(${(1 - opacity) * 16}px)`;
      el.style.pointerEvents = opacity > 0.45 ? "auto" : "none";
    });
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = String(Math.max(0, 1 - progress * 8));
    }
  }, []);

  return (
    <div className="bg-[var(--paper-50)] text-[var(--ink-900)] selection:bg-blue-600 selection:text-white">
      {/* Scroll track for 3D Camera Glide */}
      <div ref={trackRef} className="relative" style={{ height: `${SCENE_COUNT * 100}vh` }}>
        <div className="fixed inset-0">
          <FacultyOfficeDiorama trackRef={trackRef} onProgress={handleProgress} />
        </div>

        {/* Top University Navigation */}
        <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between max-w-[1180px] w-full mx-auto px-6 pt-5">
          <Link
            href="/"
            className="flex items-center text-[var(--ink-900)] no-underline bg-white/85 backdrop-blur-md rounded-full pl-3.5 pr-4.5 py-2 shadow-xs border border-blue-900/10 hover:border-blue-500/30 transition-colors"
          >
            <LogoWithText className="h-7 w-auto text-blue-950" />
          </Link>
          <div className="flex items-center gap-3 bg-white/85 backdrop-blur-md rounded-full pl-5 pr-2 py-2 shadow-xs border border-blue-900/10">
            <Link
              href="/"
              className="hidden sm:inline text-[13px] font-semibold text-slate-700 no-underline hover:text-blue-600 transition-colors"
            >
              Classic landing
            </Link>
            <Link
              href="/public/office-hours"
              className="hidden md:inline text-[13px] font-semibold text-slate-700 no-underline hover:text-blue-600 transition-colors"
            >
              Browse slots
            </Link>
            <Link
              href="/login"
              className="text-[13px] font-semibold text-slate-700 no-underline hover:text-blue-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[13px] font-bold px-[18px] py-2 rounded-full no-underline shadow-xs hover:bg-blue-700 transition-colors"
            >
              Join pilot <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>

        {/* Cross-fading 3D Editorial Story Scenes */}
        <div className="fixed inset-0 z-10 pointer-events-none">
          {SCENES.map((scene, i) => (
            <div
              key={scene.title}
              ref={(el) => {
                sceneRefs.current[i] = el;
              }}
              className="absolute inset-0 flex items-center px-6"
              style={{ opacity: i === 0 ? 1 : 0, willChange: "opacity, transform" }}
            >
              <div className="max-w-[1180px] w-full mx-auto">
                <div className="max-w-[56ch] bg-white/88 backdrop-blur-lg rounded-[22px] px-8 py-8 border border-blue-900/10 shadow-[0_12px_40px_rgba(11,27,73,0.08)]">
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800">
                      {scene.badge}
                    </span>
                    <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-blue-600">
                      {scene.eyebrow}
                    </span>
                  </div>

                  <h2 className="font-display font-black text-[clamp(26px,3.8vw,42px)] leading-[1.08] tracking-[-0.01em] text-blue-950 mb-3.5 text-balance">
                    {scene.title}
                  </h2>

                  <p className="text-[15px] leading-[1.65] text-slate-700 max-w-[48ch] mb-4">
                    {scene.body}
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fall 2026 Academic Pilot · Verified conflict-free algorithm</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Scroll Hint */}
          <div
            ref={scrollHintRef}
            className="absolute bottom-9 inset-x-0 flex flex-col items-center gap-2 text-slate-600 transition-opacity"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] bg-white/85 backdrop-blur-md rounded-full px-3.5 py-1.5 border border-blue-900/10 shadow-xs">
              Scroll to explore Room 304
            </span>
            <span className="w-[1.5px] h-8 bg-gradient-to-b from-blue-600 to-transparent" />
          </div>
        </div>
      </div>

      {/* Main Interactive Academic Experience Section */}
      <section className="relative z-10 bg-white border-t border-blue-100 py-20 px-6">
        <div className="max-w-[1180px] mx-auto">
          {/* Section Header */}
          <div className="max-w-[64ch] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Campus Role Architecture</span>
            </div>
            <h2 className="font-display font-black text-[clamp(28px,3.5vw,38px)] text-blue-950 tracking-[-0.01em] text-balance mb-3">
              Designed specifically for how university advising actually works.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Whether you are an undergraduate planning your capstone, a faculty advisor with 60 advisees, or an academic administrator auditing equity — OfficeHours removes the chaos.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-fit mb-8">
            {(["STUDENT", "LECTURER", "ADMIN"] as RoleTab[]).map((tab) => {
              const active = activeRole === tab;
              const label =
                tab === "STUDENT" ? "Students & Advisees" : tab === "LECTURER" ? "Faculty Advisors" : "Department Chairs";
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveRole(tab)}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Active Role Feature Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {ROLE_FEATURES[activeRole].features.map((feature, idx) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border-2 border-blue-950/10 bg-gradient-to-b from-slate-50/50 to-white hover:border-blue-600/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-blue-950 mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                      <span>Verified for pilot semester</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Timetable Synchronization Interactive Preview */}
          <div className="mt-20">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Interactive Engine Demo
              </span>
              <h3 className="text-2xl font-black text-blue-950 font-display mt-1">
                Try the Timetable Clash-Detection Engine
              </h3>
            </div>
            <TimetableShowcaseDemo />
          </div>
        </div>
      </section>

      {/* University Pilot Guarantee & CTA Band */}
      <section className="bg-gradient-to-b from-[#0b1b49] to-[#071230] text-white py-20 px-6 text-center">
        <div className="max-w-[800px] mx-auto">
          <span className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-blue-400/30 mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Fall 2026 University Pilot
          </span>
          <h2 className="font-display font-black text-[clamp(28px,4vw,44px)] tracking-[-0.01em] mb-4 text-balance">
            Ready for conflict-free faculty office hours?
          </h2>
          <p className="text-base text-blue-200/90 mb-8 max-w-[54ch] mx-auto leading-relaxed">
            Join students and faculty across Computer Science, Mathematics, and Engineering who have replaced email threads with guaranteed 1-click scheduling.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-500 text-white text-sm font-bold px-7 py-3.5 rounded-full no-underline shadow-lg hover:bg-blue-400 hover:shadow-xl transition-all"
            >
              Get started with university email <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/public/office-hours"
              className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-bold px-6 py-3.5 rounded-full no-underline border border-white/20 hover:bg-white/20 transition-all"
            >
              Browse active faculty slots
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--paper-50)] border-t border-slate-200 py-6 px-6">
        <div className="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>OfficeHours — Built for the University Pilot Semester.</span>
          <div className="flex gap-6">
            <Link href="/" className="text-slate-600 no-underline hover:text-blue-600">
              Classic landing
            </Link>
            <Link href="/public/office-hours" className="text-slate-600 no-underline hover:text-blue-600">
              Faculty directory
            </Link>
            <Link href="/login" className="text-slate-600 no-underline hover:text-blue-600">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
