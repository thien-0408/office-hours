import Link from "next/link";
import { Marquee } from "@/components/landing/shared";

const TICKER = ["100% money-back on complaints", "Free for students", "Fair waitlist", "Conflict-checked", "Senior-built"];

const NAV = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Why us", href: "#why-us" },
  { label: "FAQs", href: "#faqs" },
];

const SOCIAL = [
  { label: "GitHub", path: "M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5v-1.9c-2.78.62-3.37-1.36-3.37-1.36-.46-1.2-1.11-1.52-1.11-1.52-.9-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.58 2.34 1.12 2.91.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .28.18.61.69.5A9.99 9.99 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" },
  { label: "LinkedIn", path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2 3.77-2 4 0 4.73 2.6 4.73 6V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9Z" },
] as const;

export default function LandingFooter() {
  return (
    <footer>
      <Marquee items={TICKER} />

      <div className="bg-[var(--po-text-primary)] pt-14 pb-8">
        <div className="mx-auto w-full max-w-[1180px] px-6">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
            <div>
              <Link href="/" className="flex items-center gap-1 text-[15px] font-bold text-white">
                Office
                <span className="rounded-md bg-[var(--po-accent)] px-1.5 py-0.5 text-[var(--po-text-primary)]">Hours</span>
              </Link>
              <p className="mt-4 max-w-[30ch] text-[12.5px] leading-relaxed text-white/50">
                Conflict-free office hours booking, built for campus. Free for every student and
                lecturer.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">Navigation</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {NAV.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[13px] font-semibold text-white/70 hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">Socials</p>
              <div className="mt-4 flex items-center gap-2">
                {SOCIAL.map((s) => (
                  <span
                    key={s.label}
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-[11.5px] text-white/40">&copy; {new Date().getFullYear()} OfficeHours. All rights reserved.</p>
            <div className="flex items-center gap-5 text-[11.5px] text-white/40">
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link href="/register" className="hover:text-white">Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
