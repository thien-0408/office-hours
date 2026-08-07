// Restrained per docs/DESIGN.md §1 — flat surface, no glass. Glass is reserved
// for chrome (DashboardShell's sidebar/topbar/dropdowns), never content cards.
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-[var(--paper-200)] bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}
