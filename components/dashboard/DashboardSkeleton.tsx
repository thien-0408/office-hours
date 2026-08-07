// Shown while useAuth()'s initial GET /api/auth/me is in flight (the one real
// async loading state on this route right now — see (dashboard)/layout.tsx).
// Shaped like DashboardShell so there's no layout jump once the real shell mounts.
export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-[var(--paper-50)]">
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-[var(--paper-200)] bg-white/70 px-4 py-6 gap-2">
        <div className="h-6 w-28 rounded bg-[var(--paper-200)] animate-pulse mb-8" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 rounded-lg bg-[var(--paper-100)] animate-pulse" />
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[65px] shrink-0 border-b border-[var(--paper-200)] bg-white/70 px-6 flex items-center justify-between">
          <div className="h-6 w-28 rounded bg-[var(--paper-200)] animate-pulse md:hidden" />
          <div className="hidden md:block h-9 w-64 rounded-full bg-[var(--paper-100)] animate-pulse" />
          <div className="h-9 w-9 rounded-full bg-[var(--paper-100)] animate-pulse" />
        </div>

        <div className="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto">
          <div className="h-7 w-56 rounded bg-[var(--paper-200)] animate-pulse mb-2" />
          <div className="h-4 w-72 rounded bg-[var(--paper-100)] animate-pulse mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-[var(--paper-100)] animate-pulse" />
            ))}
          </div>

          <div className="h-32 rounded-2xl bg-[var(--paper-100)] animate-pulse mb-6" />
          <div className="h-64 rounded-2xl bg-[var(--paper-100)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
