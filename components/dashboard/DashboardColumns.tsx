// Composes the "three column" layout (nav sidebar from DashboardShell + this
// content/rail split) at the page level, not the shell level — layout.tsx only
// ever receives `children`, so a page-specific rail can't prop-drill through it.
// Pages that want a right rail (dashboard home, booking detail, …) wrap their
// content in this; pages that don't just render into DashboardShell's <main> directly.
export function DashboardColumns({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0 w-full">{children}</div>
      <aside className="w-full xl:w-80 shrink-0 flex flex-col gap-5">{rail}</aside>
    </div>
  );
}
