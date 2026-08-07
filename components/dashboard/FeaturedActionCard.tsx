import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

// Peach/coral treatment, matching the reference's "Course code" featured card
// — soft tinted background + a saturated coral button, not a solid-color card
// like the original blue version. Decorative accent per docs/DESIGN.md §1.2 —
// --accent (blue) still owns default buttons elsewhere.
export function FeaturedActionCard({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--coral-100)] bg-gradient-to-br from-[var(--coral-100)] to-[var(--rose-100)] text-[var(--ink-900)] p-6">
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/40" aria-hidden="true" />
      <div className="absolute -right-2 bottom-[-2.5rem] w-28 h-28 rounded-full bg-white/40" aria-hidden="true" />

      <div className="relative flex flex-col gap-3">
        <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/70 text-[var(--coral-700)]">
          <Icon className="w-5 h-5" strokeWidth={2} />
        </span>
        <div>
          <p className="text-base font-bold mb-1">{title}</p>
          <p className="text-[13px] text-[var(--ink-700)] max-w-[36ch]">{description}</p>
        </div>
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 mt-1 w-fit rounded-full bg-[var(--coral-500)] px-4 py-2 text-sm font-bold text-white no-underline hover:bg-[var(--coral-600)] transition-colors"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}
