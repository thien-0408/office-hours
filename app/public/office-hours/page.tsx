import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/lib/api-server";
import { getMockOfficeHours } from "@/lib/office-hours/mock-data";
import { LogoWithText } from "@/components/LogoWithText";
import type { PublicOfficeHoursResponse, PublicSlot } from "@/lib/office-hours/types";

export const metadata: Metadata = {
  title: "Office hours this week — OfficeHours",
};

const PAGE_SIZE = 20;

const dateHeadingFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

// Real API responses carry no lecturer photo (no PII beyond name/department, per
// docs/capstone-api-endpoints.md §10) — the mock fallback attaches one for a
// livelier demo. Normalizing both into this shape lets the card grid render
// either without branching on `usingMockData`.
type DisplaySlot = PublicSlot & { photoUrl?: string };

function groupByDay(slots: DisplaySlot[]): { dateKey: string; slots: DisplaySlot[] }[] {
  const groups = new Map<string, DisplaySlot[]>();
  for (const slot of slots) {
    const dateKey = slot.startAt.slice(0, 10);
    const bucket = groups.get(dateKey);
    if (bucket) {
      bucket.push(slot);
    } else {
      groups.set(dateKey, [slot]);
    }
  }
  return Array.from(groups.entries()).map(([dateKey, daySlots]) => ({ dateKey, slots: daySlots }));
}

function initials(name: string): string {
  return name
    .replace(/^(Dr\.|Prof\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface PageProps {
  searchParams: Promise<{ department?: string; page?: string }>;
}

export default async function PublicOfficeHoursPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const department = params.department?.trim() || "";
  const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);

  let content: DisplaySlot[];
  let totalPages: number;
  let usingMockData = false;

  try {
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    if (department) query.set("department", department);
    const res = await apiFetch<PublicOfficeHoursResponse>(`/public/office-hours?${query.toString()}`);
    content = res.content;
    totalPages = res.totalPages;
  } catch {
    // GET /public/office-hours isn't live on the backend yet (docs/capstone-api-endpoints.md §10)
    // — fall back to a deterministic mock week so the page is demoable/reviewable regardless.
    usingMockData = true;
    const res = getMockOfficeHours({ department: department || undefined, page, size: PAGE_SIZE });
    content = res.content;
    totalPages = res.totalPages;
  }

  const days = groupByDay(content);

  return (
    <div className="flex flex-col flex-1 bg-white text-slate-800 font-sans min-h-screen">
      <nav className="flex items-center justify-between max-w-[1180px] w-full mx-auto px-6 pt-7 pb-4">
        <Link href="/" className="flex items-center text-blue-900 no-underline">
          <LogoWithText className="h-7 w-auto text-blue-900" />
        </Link>
        <div className="flex items-center gap-[18px]">
          <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[13px] font-bold px-[18px] py-2.5 rounded-full no-underline shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            Get started
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-[1180px] w-full mx-auto px-6 py-10">
        <p className="inline-flex items-center gap-2 uppercase text-[11.5px] font-bold tracking-[0.11em] text-blue-600 mb-3 before:content-[''] before:w-4 before:h-[1.5px] before:bg-blue-500">
          Office hours, rebuilt for campus
        </p>
        <h1 className="[font-family:var(--font-display)] font-black uppercase text-[clamp(28px,3.6vw,40px)] leading-[1.05] tracking-[-0.01em] text-blue-950 mb-2.5 text-balance">
          Office hours this week
        </h1>
        <p className="text-base text-slate-600 max-w-[52ch] mb-8">
          Open slots across every lecturer — no account needed to browse. Register to book one.
        </p>

        <form method="GET" className="flex items-end gap-3 mb-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="department" className="text-xs font-semibold text-slate-600">
              Department
            </label>
            <input
              id="department"
              name="department"
              type="text"
              defaultValue={department}
              placeholder="e.g. Computer Science"
              className="px-3.5 py-2.5 rounded-lg border border-blue-100 bg-white text-sm text-slate-800 placeholder:text-slate-400 min-w-[240px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white text-[13px] font-bold px-[18px] py-2.5 rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            Filter
          </button>
          {department && (
            <Link
              href="/public/office-hours"
              className="text-sm font-semibold text-slate-500 hover:text-slate-900 pb-2.5 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

        {usingMockData && (
          <p className="text-[13px] text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
            Showing sample office hours — live data connects once the booking API ships.
          </p>
        )}

        {days.length === 0 && (
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-6 text-center">
            No open office hours{department ? ` for "${department}"` : ""} this week.
          </p>
        )}

        <div className="flex flex-col gap-8">
          {days.map(({ dateKey, slots }) => (
            <section key={dateKey}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-3">
                {dateHeadingFormatter.format(new Date(dateKey))}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {slots.map((slot, i) => (
                  <li
                    key={`${slot.lecturerName}-${slot.startAt}-${i}`}
                    className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-200 transition-all"
                  >
                    {slot.photoUrl ? (
                      <Image
                        src={slot.photoUrl}
                        alt=""
                        width={46}
                        height={46}
                        className="w-[46px] h-[46px] rounded-full object-cover ring-2 ring-blue-50 shrink-0"
                      />
                    ) : (
                      <div className="w-[46px] h-[46px] rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {initials(slot.lecturerName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate leading-tight">{slot.lecturerName}</p>
                      {slot.department && (
                        <p className="text-[11.5px] font-semibold text-blue-500 truncate">{slot.department}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-bold text-white bg-blue-600 rounded-full px-3 py-1.5 whitespace-nowrap tabular-nums shadow-sm group-hover:bg-blue-700 transition-colors">
                      {timeFormatter.format(new Date(slot.startAt))} – {timeFormatter.format(new Date(slot.endAt))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-9 text-sm font-semibold">
            {page > 0 ? (
              <Link
                href={`/public/office-hours?${new URLSearchParams({ ...(department ? { department } : {}), page: String(page - 1) })}`}
                className="text-blue-600 hover:underline"
              >
                ← Previous
              </Link>
            ) : (
              <span className="text-slate-300">← Previous</span>
            )}
            <span className="text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            {page + 1 < totalPages ? (
              <Link
                href={`/public/office-hours?${new URLSearchParams({ ...(department ? { department } : {}), page: String(page + 1) })}`}
                className="text-blue-600 hover:underline"
              >
                Next →
              </Link>
            ) : (
              <span className="text-slate-300">Next →</span>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-[22px] px-6">
        <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-3 text-[12.5px] text-slate-500">
          <span>OfficeHours — built for the pilot semester.</span>
          <div className="flex gap-5">
            <Link href="/" className="text-slate-500 no-underline hover:text-slate-900">
              Home
            </Link>
            <Link href="/login" className="text-slate-500 no-underline hover:text-slate-900">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
