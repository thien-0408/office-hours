import Image from "next/image";
import Link from "next/link";
import { memojiSrc } from "@/lib/avatar";
import { CheckBadge, PillTag, LimeButton, NEO_LIGHT, NEO_DARK } from "@/components/landing/shared";

const PLAN_INCLUDES = [
  "Unlimited bookings, every semester",
  "Conflict-checked against your class schedule",
  "Fair, policy-driven waitlist",
  "Recurring booking series",
  "Notifications & reminders",
  "100% free — no card required",
];

const SUPPORT_ADDONS = [
  "Priority email support for lecturers",
  "Bulk schedule import for your department",
  "Custom availability rules",
];

const PREVIEW_LECTURERS = [
  { name: "Dr. Elena Ruiz", dept: "Biology", seed: "prev-1" },
  { name: "Marcus Webb", dept: "Economics", seed: "prev-2" },
  { name: "Priya Nair", dept: "Computer Science", seed: "prev-3" },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="text-center">
        <PillTag>Official campus rollout</PillTag>
        <h2 className="mx-auto mt-4 max-w-[16ch] text-balance text-[clamp(26px,3.4vw,38px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-[var(--po-text-primary)]">
          One Plan. Free for Everyone.
        </h2>
        <p className="mx-auto mt-3 max-w-[42ch] text-[14.5px] text-[var(--po-text-primary)]/70">
          We host it, we maintain it, you just show up to office hours.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className={`rounded-3xl bg-[var(--po-text-primary)] p-6 text-[var(--po-text-tertiary)] -rotate-1 ${NEO_DARK}`}>
          <span className="inline-block rounded-full bg-[var(--po-accent)] px-2.5 py-1 text-[10px] font-bold text-[var(--po-text-primary)]">
            THE ONLY PLAN
          </span>
          <p className="mt-4 text-[38px] font-extrabold leading-none">
            $0<span className="text-[14px] font-semibold text-white/60">/forever</span>
          </p>
          <p className="mt-1 text-[12px] text-white/50">For students &amp; lecturers</p>
          <LimeButton href="/register" className="mt-5 w-full justify-center">
            Get started
          </LimeButton>
          <ul className="mt-6 flex flex-col gap-2.5 border-t border-white/10 pt-5">
            {PLAN_INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-white/75">
                <CheckBadge dark />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`rounded-3xl bg-[var(--po-accent)] p-6 rotate-1 ${NEO_LIGHT}`}>
            <span className="inline-block rounded-full bg-[var(--po-text-primary)] px-2.5 py-1 text-[10px] font-bold text-[var(--po-accent)]">
              FOR DEPARTMENTS
            </span>
            <p className="mt-3 text-[15px] font-bold text-[var(--po-text-primary)]">
              Bring your whole department online in a week
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {SUPPORT_ADDONS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[12px] font-semibold text-[var(--po-text-primary)]/80">
                  <CheckBadge />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className={`flex flex-1 items-center gap-3 rounded-3xl bg-[var(--po-surface)] p-5 -rotate-1 ${NEO_LIGHT}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--po-bg)] text-[14px] font-bold text-[var(--po-text-primary)]">
              !
            </span>
            <p className="text-[12px] leading-snug text-[var(--po-text-primary)]/70">
              No lock-in. Leave anytime &mdash; your bookings and history export with you.
            </p>
          </div>
        </div>

        <div className={`rounded-3xl bg-[var(--po-text-primary)] p-6 text-[var(--po-text-tertiary)] rotate-1 ${NEO_DARK}`}>
          <p className="text-[18px] font-bold">See it live</p>
          <p className="mt-1 text-[12px] text-white/50">Real open slots, right now.</p>
          <div className="mt-5 flex flex-col gap-3">
            {PREVIEW_LECTURERS.map((l) => (
              <div key={l.seed} className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5">
                <Image src={memojiSrc(l.seed)} alt="" width={30} height={30} className="rounded-full" />
                <div>
                  <p className="text-[12px] font-bold">{l.name}</p>
                  <p className="text-[10.5px] text-white/50">{l.dept}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/public/office-hours"
            className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--po-accent)]"
          >
            Browse all lecturers <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
