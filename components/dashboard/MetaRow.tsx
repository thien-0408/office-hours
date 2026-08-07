import type { LucideIcon } from "lucide-react";

export function MetaRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ink-600)]">
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
      {children}
    </span>
  );
}
