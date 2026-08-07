import Link from "next/link";

export function SectionHeader({
  title,
  href,
  actionLabel = "See all",
}: {
  title: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--ink-600)]">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-[var(--brand-500)] no-underline hover:underline">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
