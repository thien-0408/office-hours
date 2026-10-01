"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ToastProvider";
import { LogoWithText } from "@/components/LogoWithText";
import { initials } from "@/lib/avatar";
import { useUserAvatarSrc } from "@/lib/use-avatar";
import type { AuthUser, UserRole } from "@/lib/auth/types";
import { useI18n } from "@/i18n/provider";
import type { MessageKey } from "@/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Single shared shell, nav swaps by role — per docs/DESIGN.md app shell strategy.
function getNavItems(role: UserRole, t: (key: MessageKey) => string): NavItem[] {
  switch (role) {
    case "STUDENT":
      return [
        { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { label: t("nav.findLecturer"), href: "/dashboard/lecturers", icon: Search },
        { label: t("nav.myBookings"), href: "/dashboard/bookings", icon: CalendarDays },
        { label: t("nav.myWaitlist"), href: "/dashboard/waitlist", icon: Clock },
        { label: t("nav.mySchedule"), href: "/dashboard/schedule", icon: BookOpen },
      ];
    case "LECTURER":
      return [
        { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { label: t("nav.bookingsToReview"), href: "/dashboard/bookings", icon: CalendarDays },
        { label: t("nav.availability"), href: "/dashboard/availability", icon: SlidersHorizontal },
        { label: t("nav.mySchedule"), href: "/dashboard/schedule", icon: BookOpen },
      ];
    case "ADMIN":
      return [
        { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { label: t("nav.users"), href: "/dashboard/admin/users", icon: Users },
        { label: t("nav.schedule"), href: "/dashboard/admin/schedule", icon: CalendarDays },
        { label: t("nav.allocation"), href: "/dashboard/admin/allocation", icon: Shuffle },
        { label: t("nav.analytics"), href: "/dashboard/admin/analytics", icon: BarChart3 },
        { label: t("nav.research"), href: "/dashboard/admin/research", icon: FlaskConical },
      ];
  }
}

function roleLabel(role: UserRole, t: (key: MessageKey) => string): string {
  return role === "STUDENT" ? t("nav.roleStudent") : role === "LECTURER" ? t("nav.roleLecturer") : t("nav.roleAdmin");
}

function quickAccessFor(role: UserRole, t: (key: MessageKey) => string): { title: string; detail: string; href: string } {
  switch (role) {
    case "STUDENT":
      return { title: t("nav.findTime"), detail: t("nav.browseOpenings"), href: "/dashboard/lecturers" };
    case "LECTURER":
      return { title: t("nav.shareHours"), detail: t("nav.manageAvailability"), href: "/dashboard/availability" };
    case "ADMIN":
      return { title: t("nav.reviewAllocation"), detail: t("nav.policiesDecisions"), href: "/dashboard/admin/allocation" };
  }
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
  ariaLabel,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  ariaLabel: string;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-[45px] items-center gap-3 rounded-[11px] text-[13px] font-semibold no-underline transition-[background,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-2 ${
              collapsed ? "justify-center px-0" : "px-3"
            } ${
              active
                ? "bg-[var(--brand-50)] text-[var(--brand-700)] before:absolute before:inset-y-[9px] before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--brand-500)]"
                : "text-[var(--ink-600)] hover:translate-x-0.5 hover:bg-[var(--paper-100)] hover:text-[var(--brand-700)]"
            }`}
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${active ? "bg-[var(--brand-100)]" : ""}`}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  user,
  items,
  pathname,
  avatarSrc,
  collapsed = false,
  onNavigate,
  onToggleCollapsed,
  onClose,
  t,
  navAriaLabel,
}: {
  user: AuthUser;
  items: NavItem[];
  pathname: string;
  avatarSrc: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapsed?: () => void;
  onClose?: () => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  navAriaLabel: string;
}) {
  const quickAccess = quickAccessFor(user.role, t);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`mb-6 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between px-2"}`}>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center overflow-hidden text-[var(--brand-700)] no-underline focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]"
          aria-label="OfficeHours home"
        >
          {collapsed ? (
            <span className="block h-8 w-8 overflow-hidden">
              <LogoWithText className="h-8 w-36 max-w-none" />
            </span>
          ) : (
            <LogoWithText className="h-8 w-36" />
          )}
        </Link>
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ink-500)] transition-colors hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]"
            aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ink-500)] transition-colors hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]"
            aria-label={t("nav.closeNavigation")}
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        )}
      </div>

      {!collapsed && (
        <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink-400)]">
          {t("nav.workspace")}
        </p>
      )}
      <NavLinks items={items} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} ariaLabel={navAriaLabel} />

      <div className="mt-auto flex flex-col gap-3 pt-5">
        {!collapsed && (
          <Link
            href={quickAccess.href}
            onClick={onNavigate}
            className="relative mx-1 block overflow-hidden rounded-[13px] border border-[var(--brand-100)] bg-[var(--brand-50)] px-4 py-3.5 no-underline transition-[border-color,transform] duration-150 before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--brand-500)] hover:-translate-y-0.5 hover:border-[var(--brand-300)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-2"
          >
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--brand-700)]">
              {t("nav.quickAccess")}
            </span>
            <span className="mt-1.5 block text-sm font-bold tracking-[-0.02em] text-[var(--ink-900)]">
              {quickAccess.title}
            </span>
            <span className="mt-1 block text-[11px] text-[var(--ink-600)]">{quickAccess.detail}</span>
          </Link>
        )}
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          title={collapsed ? t("nav.myProfile") : undefined}
          aria-label={collapsed ? t("nav.myProfile") : undefined}
          className={`flex min-w-0 items-center gap-2.5 border-t border-[var(--paper-200)] pt-3 no-underline transition-colors focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] ${collapsed ? "justify-center" : "px-2 hover:text-[var(--brand-700)]"}`}
        >
          <Image
            src={avatarSrc}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-[11px] bg-[var(--brand-100)] object-cover"
          />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-[var(--ink-900)]">{user.fullName}</span>
                <span className="block truncate text-[11px] text-[var(--ink-500)]">
                  {roleLabel(user.role, t)}{user.department ? ` · ${user.department}` : ""}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ink-400)]" aria-hidden="true" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

export function DashboardShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navItems = getNavItems(user.role, t);
  const avatarSrc = useUserAvatarSrc(user.id);

  // Route changed (link click, back/forward) — close the drawer. Derived
  // during render (React's documented pattern for reacting to prop changes),
  // same technique app/(auth)/layout.tsx uses, not a setState-in-effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

  // Close the drawer if the viewport grows past the mobile breakpoint. Focus
  // trap, Esc, scroll-lock and focus-return are handled by the Sheet primitive.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    function handleViewportChange() {
      if (desktopQuery.matches) setMobileNavOpen(false);
    }
    desktopQuery.addEventListener("change", handleViewportChange);
    return () => desktopQuery.removeEventListener("change", handleViewportChange);
  }, [mobileNavOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/dashboard/lecturers?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="relative flex min-h-screen bg-[var(--paper-50)] text-[var(--ink-900)]">
      {/* A faint brand wash gives the top bar depth behind its frosted surface. */}
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(1100px_480px_at_15%_-8%,var(--brand-100),transparent_60%)]"
        aria-hidden="true"
      />

      {/* Inset sidebar with shared desktop and mobile navigation content. */}
      <aside
        className={`m-3 hidden min-h-0 shrink-0 flex-col overflow-y-auto rounded-[18px] border border-[var(--paper-200)] bg-[var(--paper-0)] p-3 shadow-[0_8px_25px_color-mix(in_srgb,var(--ink-950)_5%,transparent)] transition-[width] duration-200 md:sticky md:top-3 md:flex md:h-[calc(100dvh-1.5rem)] ${
          collapsed ? "md:w-[76px]" : "md:w-[264px]"
        }`}
      >
        <SidebarContent
          user={user}
          items={navItems}
          pathname={pathname}
          avatarSrc={avatarSrc}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          t={t}
          navAriaLabel={t("nav.mainNavigation")}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0" inert={mobileNavOpen}>
        <header className="sticky top-0 z-21 flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--paper-200)] bg-white/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full text-[var(--ink-600)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition-colors"
              aria-label={t("nav.openMenu")}
              aria-expanded={mobileNavOpen}
            >
              <Menu className="w-5 h-5" strokeWidth={1.8} />
            </button>
            <Link href="/" className="flex items-center text-[var(--brand-700)] no-underline">
              <LogoWithText className="h-6 w-auto" />
            </Link>
          </div>
          <form onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-400)]"
                strokeWidth={2}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("nav.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--paper-200)] bg-white/70 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-300)] focus:border-[var(--brand-400)] transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href="/dashboard/notifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[var(--coral-500)] text-white hover:bg-[var(--coral-600)] transition-colors"
              aria-label={t("nav.notifications")}
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white ring-1 ring-[var(--coral-600)]" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2.5 outline-none transition-colors hover:bg-[var(--brand-50)] focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]">
                <Image
                  src={avatarSrc}
                  alt={initials(user.fullName)}
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-full bg-[var(--brand-50)] object-cover ring-2 ring-[var(--brand-50)]"
                />
                <span className="hidden text-sm font-semibold text-[var(--ink-900)] sm:block">{user.fullName}</span>
                <ChevronDown className="h-4 w-4 text-[var(--ink-500)]" strokeWidth={1.8} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href="/dashboard/profile" />}>{t("nav.myProfile")}</DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setLogoutConfirmOpen(true)}
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.8} />
                  {t("nav.logOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          id="mobile-navigation"
          className="w-72 max-w-[87vw] gap-0 overflow-y-auto rounded-r-[18px] border-r border-[var(--paper-200)] bg-[var(--paper-0)] p-3 pt-5 data-[side=left]:w-72 md:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            user={user}
            items={navItems}
            pathname={pathname}
            avatarSrc={avatarSrc}
            onNavigate={() => setMobileNavOpen(false)}
            onClose={() => setMobileNavOpen(false)}
            t={t}
            navAriaLabel={t("nav.mobileNavigation")}
          />
        </SheetContent>
      </Sheet>

      <ConfirmModal
        open={logoutConfirmOpen}
        icon={ShieldAlert}
        title={t("nav.confirmLogOut")}
        description={t("nav.confirmLogOutDescription")}
        confirmLabel={t("nav.logOut")}
        cancelLabel={t("nav.cancel")}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
          toast.show("neutral", t("nav.signedOut"));
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
