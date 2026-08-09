"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Shuffle,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  BarChart3,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { LogoWithText } from "@/components/LogoWithText";
import { initials } from "@/lib/avatar";
import { useUserAvatarSrc } from "@/lib/use-avatar";
import type { AuthUser, UserRole } from "@/lib/auth/types";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Single shared shell, nav swaps by role — per docs/DESIGN.md §1.1 "App shell
// strategy" (not separate portals). Non-dashboard hrefs are the next pages to
// build (see Pages.txt) — they 404 today, that's expected at this stage.
function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "STUDENT":
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Find a Lecturer", href: "/dashboard/lecturers", icon: Search },
        { label: "My Bookings", href: "/dashboard/bookings", icon: CalendarDays },
        { label: "My Waitlist", href: "/dashboard/waitlist", icon: Clock },
      ];
    case "LECTURER":
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Bookings to Review", href: "/dashboard/bookings", icon: CalendarDays },
        { label: "Availability", href: "/dashboard/availability", icon: SlidersHorizontal },
        { label: "My Schedule", href: "/dashboard/schedule", icon: BookOpen },
      ];
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Users", href: "/dashboard/admin/users", icon: Users },
        { label: "Schedule", href: "/dashboard/admin/schedule", icon: CalendarDays },
        { label: "Allocation", href: "/dashboard/admin/allocation", icon: Shuffle },
        { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
        { label: "Research", href: "/dashboard/admin/research", icon: FlaskConical },
      ];
  }
}

function roleLabel(role: UserRole): string {
  return role === "STUDENT" ? "Student" : role === "LECTURER" ? "Lecturer" : "Admin";
}

// Shared between the desktop sidebar and the mobile drawer so the two nav
// lists can't drift out of sync — `onNavigate` closes the drawer on click.
// `collapsed` only applies to the desktop sidebar (the mobile drawer always
// renders full-width, so it never passes this prop).
function NavLinks({
  items,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 border-l-[3px] py-2.5 text-sm font-semibold no-underline transition-colors ${
              collapsed ? "justify-center px-0" : "px-3"
            } ${
              active
                ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                : "border-transparent text-[var(--ink-600)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
            }`}
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const toast = useToast();
  const prefersReducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navItems = getNavItems(user.role);
  const avatarSrc = useUserAvatarSrc(user.id);

  // Route changed (link click, back/forward) — close the drawer. Derived
  // during render (React's documented pattern for reacting to prop changes),
  // same technique app/(auth)/layout.tsx uses, not a setState-in-effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/dashboard/lecturers?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="relative flex min-h-screen bg-[var(--paper-50)] text-[var(--ink-900)]">
      {/* Faint blue wash so the glass chrome (sidebar/topbar) has something to blur — keeps
          the "white and blue" schema visible through the frosted panels per docs/DESIGN.md §1. */}
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(1100px_480px_at_15%_-8%,var(--brand-100),transparent_60%)]"
        aria-hidden="true"
      />

      {/* Sidebar — chrome, so it gets the glass treatment (DESIGN.md §1); desktop-first,
          mobile collapse is a follow-up. Collapsible via the panel-toggle button below. */}
      <aside
        className={`hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen shrink-0 border-r border-[var(--paper-200)] bg-white/70 backdrop-blur-xl py-6 transition-[width] duration-200 ${
          collapsed ? "md:w-[76px] px-3" : "md:w-64 px-4"
        }`}
      >
        <div className={`flex items-center mb-8 ${collapsed ? "flex-col gap-3" : "justify-between px-2"}`}>
          <Link href="/" className="flex items-center text-[var(--brand-700)] no-underline">
            {collapsed ? (
              <div className="w-8 h-6 overflow-hidden">
                <LogoWithText className="h-6 w-auto" />
              </div>
            ) : (
              <LogoWithText className="h-6 w-auto" />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center justify-center w-7 h-7 rounded-full text-[var(--ink-500)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" strokeWidth={1.8} />
            ) : (
              <PanelLeftClose className="w-4 h-4" strokeWidth={1.8} />
            )}
          </button>
        </div>

        <NavLinks items={navItems} pathname={pathname} collapsed={collapsed} />

        <div className={`mt-auto pt-6 border-t border-[var(--paper-200)] ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <span
              className="block w-2.5 h-2.5 rounded-full bg-[var(--brand-500)]"
              title={roleLabel(user.role)}
              aria-label={roleLabel(user.role)}
            />
          ) : (
            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[var(--brand-100)] text-[var(--brand-700)]">
              {roleLabel(user.role)}
            </span>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--paper-200)] bg-white/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full text-[var(--ink-600)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.8} />
            </button>
            <Link href="/" className="flex items-center text-[var(--brand-700)] no-underline">
              <LogoWithText className="h-6 w-auto" />
            </Link>
          </div>
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-400)]"
                strokeWidth={2}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lecturers, departments…"
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--paper-200)] bg-white/70 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-300)] focus:border-[var(--brand-400)] transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[var(--coral-500)] text-white hover:bg-[var(--coral-600)] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white ring-1 ring-[var(--coral-600)]" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-[var(--brand-50)] transition-colors"
              >
                <Image
                  src={avatarSrc}
                  alt={initials(user.fullName)}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--brand-50)] bg-[var(--brand-50)] shrink-0"
                />
                <span className="hidden sm:block text-sm font-semibold text-[var(--ink-900)]">
                  {user.fullName}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--ink-500)]" strokeWidth={1.8} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[var(--paper-200)] bg-white/85 backdrop-blur-xl shadow-lg py-1.5 z-10">
                  <Link
                    href="/dashboard/profile"
                    className="block px-3.5 py-2 text-sm text-[var(--ink-900)] no-underline hover:bg-[var(--brand-50)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-[var(--danger-700)] hover:bg-[var(--danger-100)] text-left"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.8} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-white px-4 py-6 shadow-2xl md:hidden"
              initial={prefersReducedMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-label="Navigation"
            >
              <div className="flex items-center justify-between mb-8">
                <Link
                  href="/"
                  className="flex items-center text-[var(--brand-700)] no-underline"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <LogoWithText className="h-6 w-auto" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--brand-50)] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" strokeWidth={1.8} />
                </button>
              </div>

              <NavLinks items={navItems} pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />

              <div className="mt-auto pt-6 border-t border-[var(--paper-200)]">
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[var(--brand-100)] text-[var(--brand-700)]">
                  {roleLabel(user.role)}
                </span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={logoutConfirmOpen}
        icon={ShieldAlert}
        title="Confirm Log Out"
        description="Are you sure you want to log out of your OfficeHours account?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
          toast.show("neutral", "Signed out");
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
