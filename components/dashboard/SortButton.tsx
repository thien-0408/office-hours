import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sortable table-header trigger — shared by BookingsTable and the admin users table.
export function SortButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={active ? "link-brand" : "link-muted"}
      onClick={onClick}
      className={`text-[11px] font-bold uppercase tracking-wide no-underline hover:no-underline ${
        active ? "text-[var(--brand-700)]" : "text-[var(--ink-500)] hover:text-[var(--brand-700)]"
      }`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" strokeWidth={2} />
    </Button>
  );
}
