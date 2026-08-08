"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import rough from "roughjs";
import { LogoWithText } from "@/components/LogoWithText";
import SchedulingHeroBackground from "@/components/SchedulingHeroBackground";
import HeroBookingDemo from "@/components/HeroBookingDemo";

const VALUE_PROPS = [
  {
    numeral: "01",
    title: "Conflict-checked automatically",
    body: "Every open slot is already checked against your class schedule and your lecturer's. If it's on the calendar, it's actually free.",
  },
  {
    numeral: "02",
    title: "No more double-booking",
    body: "A database-level guard means the same slot can never go to two people, even if you both click at the same second.",
  },
  {
    numeral: "03",
    title: "A fair waitlist",
    body: "Slot's full? Join the queue. When a spot opens up, it's offered by a published policy — not by who refreshed the fastest.",
  },
];

const STUDENT_POINTS = [
  "See a lecturer's real open slots — already checked against your own class schedule.",
  "Request a slot in one click. No email thread, no waiting to hear back.",
  "Slot's full? Join the waitlist — offers go out by a published, logged policy, not by who refreshed fastest.",
];

const LECTURER_POINTS = [
  "Set recurring weekly availability once, plus one-off exceptions when plans change.",
  "Every request is pre-checked against your teaching schedule — no double-books to untangle.",
  "Confirm or decline in a tap. No-shows and attendance are tracked automatically.",
];

const RESEARCH_STATS = [
  { value: "4", label: "allocation policies compared head-to-head — FCFS, priority-by-need, round-robin, hybrid" },
  { value: "100%", label: "of waitlist decisions logged with policy, score & seed — fully reproducible" },
  { value: "0", label: "double-bookings possible — enforced by a database exclusion constraint, not app code" },
];

export default function LandingPage() {
  const circleSvgRef = useRef<SVGSVGElement | null>(null);
  const cardSvgRefs = useRef<(SVGSVGElement | null)[]>([]);
  const underlineSvgRef = useRef<SVGSVGElement | null>(null);
  const studentBlobRef = useRef<SVGSVGElement | null>(null);
  const lecturerBlobRef = useRef<SVGSVGElement | null>(null);

  // Initialize Rough.js Sketched UI Elements
  useEffect(() => {
    if (underlineSvgRef.current) {
      const svg = underlineSvgRef.current;
      svg.innerHTML = "";
      const rcSvg = rough.svg(svg);
      const scribble = rcSvg.curve(
        [
          [4, 12],
          [90, 4],
          [180, 16],
          [268, 7],
        ],
        { stroke: "#3465e0", strokeWidth: 5, roughness: 2.2, bowing: 2.5 }
      );
      svg.appendChild(scribble);
    }

    [studentBlobRef, lecturerBlobRef].forEach((ref) => {
      if (!ref.current) return;
      const svg = ref.current;
      svg.innerHTML = "";
      const rcSvg = rough.svg(svg);
      const ring1 = rcSvg.ellipse(49, 49, 84, 84, {
        stroke: "#2563eb",
        strokeWidth: 3,
        roughness: 2.3,
        bowing: 2.5,
      });
      const ring2 = rcSvg.ellipse(50, 50, 92, 90, {
        stroke: "#3b82f6",
        strokeWidth: 1.5,
        roughness: 1.8,
        bowing: 2,
      });
      svg.appendChild(ring1);
      svg.appendChild(ring2);
    });

    if (circleSvgRef.current) {
      const svg = circleSvgRef.current;
      svg.innerHTML = "";
      const rcSvg = rough.svg(svg);

      const ring1 = rcSvg.ellipse(59, 59, 100, 100, {
        stroke: "#2563eb",
        strokeWidth: 3,
        roughness: 2.5,
        bowing: 3,
      });

      const ring2 = rcSvg.ellipse(60, 60, 108, 108, {
        stroke: "#3b82f6",
        strokeWidth: 1.5,
        roughness: 2.0,
        bowing: 2,
      });

      svg.appendChild(ring1);
      svg.appendChild(ring2);
    }

    cardSvgRefs.current.forEach((svg) => {
      if (!svg) return;
      svg.innerHTML = "";
      const rcSvg = rough.svg(svg);
      const width = svg.clientWidth;
      const height = svg.clientHeight;

      const box = rcSvg.rectangle(3, 3, width - 6, height - 6, {
        stroke: "#cbd5e1",
        strokeWidth: 2,
        roughness: 1.6,
        bowing: 1.8,
      });

      svg.appendChild(box);
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-white text-slate-800 font-sans min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-[90px] border-b border-blue-100">
        <SchedulingHeroBackground />

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between max-w-[1180px] mx-auto px-6 pt-7">
          <div className="flex items-center text-blue-900">
            <LogoWithText className="h-7 w-auto text-blue-900" />
          </div>
          <div className="hidden md:flex items-center gap-[30px] text-sm text-slate-600 font-medium">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              How it works
            </a>
            <a href="#for-students" className="hover:text-blue-600 transition-colors">
              For students
            </a>
            <a href="#for-lecturers" className="hover:text-blue-600 transition-colors">
              For lecturers
            </a>
            <Link href="/public/office-hours" className="hover:text-blue-600 transition-colors">
              Browse office hours
            </Link>
          </div>
          <div className="flex items-center gap-[18px]">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[13px] font-bold px-[18px] py-2.5 rounded-full no-underline shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
            >
              Get started{" "}
              <span className="text-blue-200 font-bold">— it&apos;s free</span>
            </Link>
          </div>
        </nav>

        {/* Hero Main Content */}
        <div className="relative z-10 max-w-[1180px] mx-auto pt-16 px-6 grid grid-cols-[1.15fr_0.85fr] gap-10 items-center max-md:grid-cols-1 max-md:pt-11">
          <div>
            <p className="inline-flex items-center gap-2 uppercase text-[11.5px] font-bold tracking-[0.11em] text-blue-600 mb-5 before:content-[''] before:w-4 before:h-[1.5px] before:bg-blue-500">
              Office hours, rebuilt for campus
            </p>
            <h1 className="[font-family:var(--font-display)] font-black uppercase text-[clamp(34px,4.4vw,54px)] leading-[1.02] tracking-[-0.01em] text-blue-950 mb-[22px] text-balance">
              Office hours
              <br />
              not{" "}
              <span className="relative inline-block">
                email threads
                <svg
                  ref={underlineSvgRef}
                  className="absolute left-0 -bottom-2 w-full h-4 pointer-events-none"
                  viewBox="0 0 272 20"
                  preserveAspectRatio="none"
                />
              </span>
            </h1>
            <p className="text-base leading-[1.65] text-slate-600 max-w-[46ch] mb-9">
              See a lecturer&apos;s real open slots, book one in a click, and never worry about
              double-booking. Every slot you see is already conflict-free with your own class
              schedule.
            </p>

            <div className="flex items-center gap-[18px]">
              <div className="relative w-[118px] h-[118px] flex items-center justify-center shrink-0">
                <svg
                  ref={circleSvgRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 120 120"
                />
                <span className="relative text-[13px] font-extrabold text-blue-600 text-center leading-[1.2] px-3.5 uppercase tracking-[0.01em]">
                  Free for students
                </span>
              </div>
              <p className="text-[13.5px] leading-[1.6] text-slate-600 m-0">
                <strong className="text-blue-950 font-[650]">Open for the pilot semester.</strong>
                <br />
                No approvals to wait on — register and go.
              </p>
            </div>
          </div>

          {/* Right Column: interactive booking demo */}
          <div className="relative flex items-center justify-center max-md:mt-2">
            <HeroBookingDemo />

            {/* Sticker: nudges people to notice it's interactive */}
            <span className="absolute -top-3 right-4 z-20 rotate-[4deg] bg-blue-950 text-white text-[10.5px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border border-white/25 shadow-[3px_3px_0_0_#3465e0]">
              Try it · Book a slot
            </span>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="bg-white py-[84px] px-6" id="how-it-works">
        <div className="max-w-[1180px] mx-auto">
          <div className="max-w-[60ch] mb-12">
            <p className="uppercase text-[11.5px] font-bold tracking-[0.1em] text-blue-600 mb-2.5">
              Why it&apos;s different
            </p>
            <h2 className="[font-family:var(--font-display)] font-extrabold text-[clamp(24px,3vw,32px)] tracking-[-0.01em] m-0 text-slate-900 text-balance">
              Built around the one thing office-hours tools usually get wrong: conflicts.
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1 pt-2">
            {VALUE_PROPS.map((prop, idx) => {
              const rotation = ["-rotate-1", "rotate-1", "-rotate-1"][idx];
              const inverted = idx === 1;
              return (
                <div
                  key={prop.numeral}
                  className={`relative ${rotation} transition-transform hover:rotate-0 hover:-translate-y-1`}
                >
                  <div
                    className={`relative rounded-[18px] px-6 py-8 border-2 border-blue-950 overflow-hidden ${
                      inverted
                        ? "bg-blue-950 text-white shadow-[7px_7px_0_0_#3465e0]"
                        : "bg-white shadow-[7px_7px_0_0_#0b1b49]"
                    }`}
                  >
                    <svg
                      ref={(el) => (cardSvgRefs.current[idx] = el)}
                      className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                    />
                    <div
                      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full font-mono text-xs font-bold mb-4.5 rotate-[-3deg] border-2 ${
                        inverted
                          ? "bg-white text-blue-950 border-white"
                          : "bg-blue-600 text-white border-blue-950"
                      }`}
                    >
                      {prop.numeral}
                    </div>
                    <h3
                      className={`relative text-[16.5px] font-bold mb-2.5 ${
                        inverted ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {prop.title}
                    </h3>
                    <p
                      className={`relative text-[13.5px] leading-[1.65] m-0 ${
                        inverted ? "text-blue-100" : "text-slate-600"
                      }`}
                    >
                      {prop.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Students Section */}
      <section className="bg-blue-50/50 py-[84px] px-6 overflow-hidden" id="for-students">
        <div className="max-w-[1180px] mx-auto grid grid-cols-[0.9fr_1.1fr] gap-14 items-center max-md:grid-cols-1">
          <div className="relative flex items-center justify-center order-2 max-md:order-1">
            <svg
              ref={studentBlobRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            />
            <div className="relative -rotate-2 bg-white border-2 border-blue-950 rounded-[18px] px-7 py-6 max-w-[320px] shadow-[8px_8px_0_0_#0b1b49]">
              <span className="absolute -top-3 left-6 bg-blue-200 text-blue-950 text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rotate-[-2deg] border border-blue-950 rounded-sm">
                Student
              </span>
              <p className="text-[15px] leading-[1.6] text-slate-800 italic m-0">
                &ldquo;Emails go unanswered; slots are taken before I even see them.&rdquo;
              </p>
              <p className="mt-3 text-[12.5px] font-semibold text-slate-500 m-0">— Minh, sophomore</p>
            </div>
          </div>

          <div className="order-1 max-md:order-2">
            <p className="uppercase text-[11.5px] font-bold tracking-[0.1em] text-blue-600 mb-2.5">
              For students
            </p>
            <h2 className="[font-family:var(--font-display)] font-extrabold text-[clamp(24px,3vw,32px)] tracking-[-0.01em] m-0 mb-6 text-slate-900 text-balance">
              Book time with your advisor, not a game of email chicken.
            </h2>
            <ul className="flex flex-col gap-4 m-0 p-0 list-none">
              {STUDENT_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-950 flex items-center justify-center text-white text-[11px] font-bold">
                    ✓
                  </span>
                  <span className="text-[14.5px] leading-[1.6] text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* For Lecturers Section */}
      <section className="bg-white py-[84px] px-6 overflow-hidden" id="for-lecturers">
        <div className="max-w-[1180px] mx-auto grid grid-cols-[1.1fr_0.9fr] gap-14 items-center max-md:grid-cols-1">
          <div>
            <p className="uppercase text-[11.5px] font-bold tracking-[0.1em] text-blue-600 mb-2.5">
              For lecturers
            </p>
            <h2 className="[font-family:var(--font-display)] font-extrabold text-[clamp(24px,3vw,32px)] tracking-[-0.01em] m-0 mb-6 text-slate-900 text-balance">
              Publish your availability once. Stop tracking it in your head.
            </h2>
            <ul className="flex flex-col gap-4 m-0 p-0 list-none">
              {LECTURER_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-950 flex items-center justify-center text-white text-[11px] font-bold">
                    ✓
                  </span>
                  <span className="text-[14.5px] leading-[1.6] text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center justify-center">
            <svg
              ref={lecturerBlobRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            />
            <div className="relative rotate-2 bg-blue-950 text-white border-2 border-blue-950 rounded-[18px] px-7 py-6 max-w-[320px] shadow-[8px_8px_0_0_#3465e0]">
              <span className="absolute -top-3 left-6 bg-blue-400 text-blue-950 text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rotate-[2deg] border border-blue-950 rounded-sm">
                Lecturer
              </span>
              <p className="text-[15px] leading-[1.6] italic m-0">
                &ldquo;No-shows and double-bookings ate my week.&rdquo;
              </p>
              <p className="mt-3 text-[12.5px] font-semibold text-blue-200 m-0">— Dr. Lan, faculty advisor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Research / Fairness Section */}
      <section className="bg-blue-950 py-[76px] px-6">
        <div className="max-w-[1180px] mx-auto">
          <div className="max-w-[62ch] mb-11">
            <span className="inline-block bg-blue-400 text-blue-950 text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rotate-[-2deg] border border-white/40 rounded-sm mb-3">
              Not just a booking form
            </span>
            <h2 className="[font-family:var(--font-display)] font-extrabold text-[clamp(22px,2.8vw,30px)] tracking-[-0.01em] m-0 text-white text-balance">
              Scarce office-hour slots, allocated by a published, fairness-driven policy — not by who refreshed fastest.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
            {RESEARCH_STATS.map((stat, idx) => (
              <div
                key={stat.label}
                className={`bg-blue-900 border-2 border-blue-400/60 rounded-[16px] px-6 py-7 ${
                  idx === 1 ? "rotate-1" : idx === 2 ? "-rotate-1" : "rotate-0"
                }`}
              >
                <div className="[font-family:var(--font-display)] font-black text-[clamp(30px,3.5vw,42px)] text-blue-300 leading-none mb-2.5">
                  {stat.value}
                </div>
                <p className="text-[13px] leading-[1.6] text-blue-100 m-0">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-19 px-6 text-center text-white">
        <h2 className="[font-family:var(--font-display)] font-black uppercase text-[clamp(26px,4vw,40px)] tracking-[-0.01em] text-white mb-3.5 text-balance">
          Ready to stop emailing your professor?
        </h2>
        <p className="text-sm text-blue-100 mb-7">Registration takes about a minute.</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-white text-blue-600 text-sm font-bold px-[26px] py-[13px] rounded-full no-underline shadow-lg hover:bg-blue-50 transition-all hover:-translate-y-0.5"
        >
          Get started — it&apos;s free
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-[22px] px-6">
        <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-3 text-[12.5px] text-slate-500">
          <span>OfficeHours — built for the pilot semester.</span>
          <div className="flex gap-5">
            <Link href="/public/office-hours" className="text-slate-500 no-underline hover:text-slate-900">
              Public listing
            </Link>
            <Link href="/login" className="text-slate-500 no-underline hover:text-slate-900">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}