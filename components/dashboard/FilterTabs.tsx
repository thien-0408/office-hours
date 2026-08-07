// Generic segmented filter control — shared by My Bookings (status filter)
// and Notifications (All/Unread). Active tab gets the brand-blue treatment;
// DESIGN.md keeps brand-500 as the only primary/interactive color.
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--paper-200)] bg-white p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
              active
                ? "bg-[var(--brand-500)] text-white"
                : "text-[var(--ink-600)] hover:bg-[var(--paper-100)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
