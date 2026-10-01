import { cn } from "@/lib/utils";

// Restrained per docs/DESIGN.md §1 — flat surface, no glass. Glass is reserved
// for chrome (DashboardShell's sidebar/topbar/dropdowns), never content cards.
// Deliberately NOT components/ui/card (a flex-col with gap/overflow-hidden that
// would break the many call sites passing their own layout classes) — use that
// one for new composed cards. When `onClick` is passed the card becomes a
// keyboard-operable button-like surface.
export function Card({
  className = "",
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      {...(onClick && {
        role: "button",
        tabIndex: 0,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        },
      })}
      className={cn("rounded-2xl border border-[var(--paper-200)] bg-white p-5", onClick && "cursor-pointer", className)}
    >
      {children}
    </div>
  );
}
