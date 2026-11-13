"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { inter } from "@/components/mochy/fonts";
import { OhLogo } from "@/components/mochy/OhLogo";
import { StatusGlyph } from "@/components/mochy/StatusGlyph";
import { Press3D } from "@/components/mochy/Press3D";
import { Odometer } from "@/components/mochy/Odometer";
import { MOCHY_EASE, MOCHY_SPRING, PAGE_RISE } from "@/components/mochy/motion";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/mochy/ThemeSwitcher";
import type { MochyTheme } from "@/components/mochy/theme";
import { useI18n } from "@/i18n/provider";

// Client shell for the (auth) group; layout.tsx passes the theme read from the cookie.
// Auth in the Mochy style (docs/DESIGN.md §8), light or dark: form on the left, and on wide
// screens a content panel on the right built from people, not icons or sticker cards:
// a dense "open today" list of lecturers (portrait photos) over the confirmed-booking card.

type Lecturer = { name: string; dept: string; room: string; photo: string; slots: string[] };

// Room codes are NNN.B11: the first digit is the floor.
const LECTURERS: Lecturer[] = [
  { name: "TS. Nguyễn Minh Khoa", dept: "Khoa CNTT", room: "306.B11", photo: "/avatars/real/khoa.jpg", slots: ["14:00", "14:30", "15:15"] },
  { name: "TS. Trần Thu Hà", dept: "Kinh tế & Quản lý", room: "204.B11", photo: "/avatars/real/ha.jpg", slots: ["09:30", "10:00"] },
  { name: "ThS. Lê Hoàng", dept: "Kỹ thuật Phần mềm", room: "102.B11", photo: "/avatars/real/hoang.jpg", slots: ["15:00", "16:00", "16:30"] },
  { name: "TS. Võ Hải Đăng", dept: "Điện – Điện tử", room: "401.B11", photo: "/avatars/real/dang.jpg", slots: ["15:30"] },
];

// Demo countdown on the showcase booking card.
const COUNTDOWN_START = 1 * 3600 + 42 * 60 + 8;

function formatCountdown(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Portrait({ src, alt, size, className = "" }: { src: string; alt: string; size: number; className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden bg-[var(--m-s3)] ${className}`} style={{ width: size, height: size }}>
      <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

export default function AuthShell({ children, initialTheme }: { children: React.ReactNode; initialTheme: MochyTheme }) {
  const [theme, setTheme] = useState<MochyTheme>(initialTheme);
  const [left, setLeft] = useState(COUNTDOWN_START);
  const [picked, setPicked] = useState("14:00");
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { t } = useI18n();

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : COUNTDOWN_START)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const [hero, ...others] = LECTURERS;
  const rise = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: MOCHY_EASE, delay: 0.25 + i * 0.07 },
  });

  return (
    <div data-mochy-theme={theme} className={`mochy relative flex min-h-screen flex-1 flex-col overflow-hidden ${inter.variable}`}>
      <div className="pointer-events-none absolute inset-0 z-0 select-none" aria-hidden="true">
        <div className="m-glow -left-48 -top-56 h-[520px] w-[620px] bg-[#4b47a0] [--o:0.32]" />
        <div className="m-glow -bottom-64 right-[-10%] h-[520px] w-[640px] bg-[#2f6b52] [--o:0.22]" />
        <div className="m-grain" />
      </div>

      <nav className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 pt-7">
        <Link href="/" className="m-press rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-focus)]" aria-label="OfficeHours">
          <OhLogo />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher value={theme} onChange={setTheme} />
          <LocaleSwitcher variant="mochy" />
          <Link
            href="/"
            className="m-press hidden h-9 items-center rounded-full px-4 text-[13.5px] font-semibold tracking-[-0.02em] text-[var(--m-fg2)] transition-colors hover:bg-[var(--m-glass-hi)] hover:text-[var(--m-fg)] sm:inline-flex"
          >
            {t("auth.backHome")}
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto grid w-full max-w-[1240px] flex-1 gap-10 px-6 pb-10 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:pt-6">
        <main className="flex items-center justify-center lg:justify-start lg:pl-[10%]">
          <div className="w-full max-w-[400px]">
            <AnimatePresence mode="wait" initial={false}>
              {/* Children rise in through CSS (.m-page); this wrapper only handles the exit. */}
              <motion.div key={pathname} exit={reduce ? undefined : PAGE_RISE.leave}>
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <aside className="m-card relative hidden overflow-hidden rounded-[32px] p-8 lg:flex lg:flex-col lg:gap-6">
          <div className="m-glow left-1/2 top-[-160px] h-[380px] w-[460px] -translate-x-1/2 bg-[#3465e0] [--o:0.22]" aria-hidden="true" />

          {/* Outlined words drifting behind the list */}
          <div className="m-ghost absolute inset-x-0 top-[38%] text-[120px] font-extrabold leading-[0.85] tracking-[-0.04em]" aria-hidden="true">
            <div className="m-ghost-row">
              <span className="pr-[0.22em]">officehours</span>
              <span className="pr-[0.22em]">officehours</span>
            </div>
            <div className="m-ghost-row rev">
              <span className="pr-[0.22em]">office hours</span>
              <span className="pr-[0.22em]">office hours</span>
            </div>
          </div>

          <div className="relative">
            <p className="m-rise-in max-w-[460px] text-[38px] font-bold leading-[1.04] tracking-[-0.06em] text-[var(--m-fg)] [--d:0.1s]">
              {t("auth.showcase.title")}
            </p>
            <p className="m-rise-in mt-3 max-w-[440px] text-[14.5px] font-medium leading-relaxed tracking-[-0.012em] text-[var(--m-fg2)] [--d:0.22s]">
              {t("auth.showcase.subtitle")}
            </p>
          </div>

          {/* Open today: the featured lecturer with bookable slots, then the rest of the list. */}
          <section className="m-glass relative flex flex-1 flex-col rounded-[26px] p-2">
            <motion.div {...rise(0)} className="flex items-baseline justify-between px-3 pb-2 pt-2.5">
              <span className="text-[15px] font-bold tracking-[-0.03em] text-[var(--m-fg)]">{t("auth.showcase.listTitle")}</span>
              <span className="text-[12px] font-semibold text-[var(--m-fg3)]">{t("auth.showcase.listMeta", { n: LECTURERS.length })}</span>
            </motion.div>

            <motion.div {...rise(1)}>
              <Press3D>
                <div className="rounded-[20px] bg-[var(--m-s1)] p-4 shadow-[inset_0_0_0_1px_var(--m-line),var(--m-shadow)]">
                  <div className="flex items-center gap-3.5">
                    <Portrait src={hero.photo} alt={hero.name} size={56} className="rounded-[17px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-bold tracking-[-0.03em] text-[var(--m-fg)]">{hero.name}</p>
                      <p className="truncate text-[12.5px] font-medium text-[var(--m-fg3)]">
                        {hero.dept} · {t("auth.showcase.openToday", { n: hero.slots.length })}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--m-glass-hi)] px-2.5 py-1 text-[11.5px] font-bold tabular-nums text-[var(--m-fg2)]">
                      {hero.room}
                    </span>
                  </div>
                  <div className="mt-3.5 grid grid-cols-3 gap-2" role="group" aria-label={hero.name}>
                    {hero.slots.map((slot) => {
                      const on = slot === picked;
                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setPicked(slot)}
                          className="m-slide m-press relative h-9 cursor-pointer rounded-full bg-[var(--m-s3)] text-[12.5px] font-bold tabular-nums text-[var(--m-fg2)]"
                        >
                          {on && <motion.span layoutId="auth-slot" transition={MOCHY_SPRING.indicator} className="m-fill" />}
                          <span className={`relative ${on ? "text-[var(--m-bg)]" : ""}`}>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Press3D>
            </motion.div>

            <ul className="mt-1 flex flex-1 flex-col justify-around">
              {others.map((l, i) => (
                <motion.li key={l.name} {...rise(i + 2)} className="m-hl flex items-center gap-3 rounded-[18px] px-3 py-2.5">
                  <Portrait src={l.photo} alt={l.name} size={42} className="rounded-[13px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold tracking-[-0.025em] text-[var(--m-fg)]">{l.name}</p>
                    <p className="truncate text-[12px] font-medium text-[var(--m-fg3)]">
                      {l.dept} · {l.room}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {l.slots.slice(0, 2).map((s) => (
                      <span key={s} className="rounded-full bg-[var(--m-glass-hi)] px-2.5 py-1 text-[11.5px] font-bold tabular-nums text-[var(--m-fg)]">
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* The booking confirmed card arrives like Mochy's TopToast */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 50, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...MOCHY_SPRING.toast, delay: 0.65, opacity: { duration: 0.16, delay: 0.65 } }}
            className="m-glass relative rounded-[26px] p-3.5"
          >
            <div className="flex items-center gap-3.5">
              <Portrait src={hero.photo} alt="" size={52} className="rounded-[16px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold tracking-[-0.03em] text-[var(--m-fg)]">{hero.name}</p>
                <p className="truncate text-[12.5px] font-medium text-[var(--m-fg2)]">
                  {t("auth.showcase.today", { time: picked, room: hero.room })}
                </p>
              </div>
              <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--m-glass-hi)] pl-2.5 pr-3.5 text-[13px] font-semibold text-[var(--m-fg)]">
                <StatusGlyph glyph="ok" className="h-4 w-4" />
                {t("auth.bookingConfirmed")}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-[var(--m-line)] px-1 pt-3">
              <span className="text-[12.5px] font-semibold text-[var(--m-fg3)]">{t("auth.showcase.startsIn")}</span>
              <Odometer value={formatCountdown(left)} className="text-[28px] font-bold tracking-[-0.05em] text-[var(--m-fg)]" />
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
