import Link from "next/link";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#why-us", label: "Why us" },
  { href: "#faqs", label: "FAQs" },
];

export default function LandingNav() {
  return (
    <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-8">
      <Link
        href="/"
        className="flex items-center gap-1 text-[18px] font-bold tracking-[-0.01em] text-[var(--po-text-primary)]"
      >
        Office
        <span className="rounded-md bg-[var(--po-text-primary)] px-2 py-0.5 text-[var(--po-accent)]">
          Hours
        </span>
      </Link>

      <nav className="hidden items-center gap-9 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--po-text-primary)] md:flex">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="transition-opacity hover:opacity-60">
            {link.label}
          </a>
        ))}
      </nav>

      <Link
        href="/register"
        className="inline-flex items-center gap-2.5 rounded-full bg-[var(--po-text-primary)] py-2.5 pl-5 pr-2 text-[11.5px] font-bold uppercase tracking-[0.04em] text-white"
      >
        Get started
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--po-accent)] text-[var(--po-text-primary)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
    </header>
  );
}
