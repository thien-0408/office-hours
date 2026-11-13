// Monochrome OfficeHours mark: "o" is a time ring left open at 12–2 o'clock (an open slot),
// "h" stands next to it. Same paths as office-hours-mobile/docs/mockups-mochy/logo/oh-mark.svg.
export function OhMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M58.67 63.48A22 22 0 1 1 38 49" />
      <path d="M74 27V93" />
      <path d="M74 63A14 14 0 0 1 102 63V93" />
    </svg>
  );
}

// App-icon tile + lowercase wordmark, Inter 700 at -0.05em (docs/DESIGN.md §8.7).
export function OhLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[var(--m-fg)] text-[var(--m-bg)]">
        <OhMark className="h-7 w-7" />
      </span>
      <span className="text-[19px] font-bold tracking-[-0.05em] text-[var(--m-fg)]">officehours</span>
    </span>
  );
}
