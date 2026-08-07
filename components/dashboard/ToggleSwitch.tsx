export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-2.5 cursor-pointer">
      <span>
        <span className="block text-sm font-semibold text-[var(--ink-900)]">{label}</span>
        {description && <span className="block text-[12.5px] text-[var(--ink-500)]">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className="w-10 h-6 rounded-full bg-[var(--paper-200)] transition-colors peer-checked:bg-[var(--brand-500)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-300)]"
        />
        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
