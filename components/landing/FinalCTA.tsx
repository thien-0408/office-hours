import Link from "next/link";
import { DarkButton, NEO_LIGHT } from "@/components/landing/shared";

export default function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className={`rounded-3xl bg-[var(--po-accent)] px-8 py-14 text-center -rotate-1 md:px-16 md:py-20 ${NEO_LIGHT}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-primary)]/60">
          Free, forever, for your whole campus
        </p>
        <h2 className="mx-auto mt-4 max-w-[18ch] text-balance text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.01em] text-[var(--po-text-primary)]">
          Your Inbox Won&rsquo;t Fix Itself. Good Thing We Will.
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[14.5px] leading-[1.6] text-[var(--po-text-primary)]/70">
          Create an account and book, or set your availability, in under two minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <DarkButton href="/register">Get started free</DarkButton>
          <Link
            href="/public/office-hours"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--po-text-primary)] py-2.5 pl-5 pr-2 text-[13px] font-bold uppercase tracking-[0.03em] text-[var(--po-text-primary)] transition-transform hover:-translate-y-0.5"
          >
            Browse lecturers
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--po-text-primary)] text-[var(--po-accent)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
