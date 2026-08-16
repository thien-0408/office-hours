import { NEO_LIGHT } from "@/components/landing/shared";

// A read-only preview of the real weekly timetable feature
// (components/dashboard/TimetableGrid.tsx, the grid that renders a
// student's parsed AAO schedule export) — same shift bands (Ca Sáng/Chiều/Tối)
// and course data conventions, rebuilt as static markup in the landing
// page's own neo-brutalist token scope rather than importing the dashboard
// component directly (that one is wired to admin CRUD callbacks and the
// --brand-*/--coral-* app-shell tokens, neither of which belong here).

type Hue = "blue" | "orange" | "green" | "pink" | "violet";

interface Block {
  day: number; // 0-4 = Mon-Fri
  start: string; // "HH:MM"
  end: string;
  code?: string;
  group?: string;
  title: string;
  room: string;
  hue: Hue;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// 07:30–18:30 in 30-minute rows, matching the real grid's granularity.
const START_MIN = 7 * 60 + 30;
const END_MIN = 18 * 60 + 30;
const ROW_MIN = 30;
const ROW_COUNT = (END_MIN - START_MIN) / ROW_MIN;
const ROW_PX = 22;

const HOUR_LABELS = Array.from({ length: ROW_COUNT + 1 }, (_, i) => {
  const total = START_MIN + i * ROW_MIN;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h.toString().padStart(2, "0")}:00` : "";
});

const SHIFTS = [
  { label: "Ca Sáng", from: 7 * 60 + 30, to: 12 * 60 + 30 },
  { label: "Ca Chiều", from: 12 * 60 + 30, to: 16 * 60 + 30 },
  { label: "Ca Tối", from: 16 * 60 + 30, to: 18 * 60 + 30 },
];

const HUE_STYLES: Record<Hue, string> = {
  blue: "bg-blue-100 border-blue-400 text-blue-900",
  orange: "bg-orange-100 border-orange-400 text-orange-900",
  green: "bg-green-100 border-green-400 text-green-900",
  pink: "bg-pink-100 border-pink-400 text-pink-900",
  violet: "bg-violet-100 border-violet-400 text-violet-900",
};

const HUE_BADGE: Record<Hue, string> = {
  blue: "bg-blue-600",
  orange: "bg-orange-600",
  green: "bg-green-600",
  pink: "bg-pink-600",
  violet: "bg-violet-600",
};

const BLOCKS: Block[] = [
  { day: 0, start: "09:30", end: "11:30", code: "CSW 437", group: "E1", title: "Thiết kế trải nghiệm người dùng", room: "213.B08", hue: "orange" },
  { day: 0, start: "11:30", end: "13:00", code: "CS 301", group: "02", title: "Algorithms", room: "302.B08", hue: "green" },
  { day: 0, start: "16:30", end: "18:30", code: "CSW 430", group: "01", title: "Phát triển ứng dụng di động", room: "ONLINE 3", hue: "blue" },
  { day: 1, start: "09:00", end: "10:30", code: "CS 410", group: "01", title: "Capstone Seminar", room: "105.B08", hue: "pink" },
  { day: 1, start: "16:30", end: "18:30", code: "CSE 422", group: "E", title: "Kỹ năng lập trình chuyên nghiệp", room: "221.B08", hue: "violet" },
  { day: 2, start: "07:30", end: "11:30", code: "CSW 430", group: "01", title: "Phát triển ứng dụng di động", room: "LAB405.B08", hue: "blue" },
  { day: 2, start: "13:00", end: "14:00", title: "Thesis Committee Defense", room: "Meeting Room 402", hue: "orange" },
  { day: 3, start: "07:30", end: "11:30", code: "CSE 422", group: "E", title: "Kỹ năng lập trình chuyên nghiệp", room: "LAB403.B08", hue: "violet" },
  { day: 4, start: "12:30", end: "16:30", code: "CSW 437", group: "E1", title: "Thiết kế trải nghiệm người dùng", room: "LAB405.B08", hue: "orange" },
  { day: 4, start: "16:30", end: "18:30", code: "CSE 422", group: "E", title: "Kỹ năng lập trình chuyên nghiệp", room: "221.B08", hue: "violet" },
];

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function rowStart(t: string) {
  return (toMin(t) - START_MIN) / ROW_MIN + 1;
}

export default function TimetablePreview() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-secondary)]">
          Not just a calendar — your actual class schedule
        </p>
        <h2 className="mx-auto mt-3 max-w-[22ch] text-balance text-[clamp(26px,3.4vw,38px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-[var(--po-text-primary)]">
          Every Open Slot, Checked Against the Timetable You Already Have
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-[14.5px] leading-[1.65] text-[var(--po-text-primary)]/70">
          Upload your official AAO schedule export once — parsed entirely in your browser, nothing
          uploaded to a server — and OfficeHours builds this exact week view. Every slot you&rsquo;re
          offered is already checked against it, shift by shift.
        </p>
      </div>

      <div className={`mt-10 overflow-x-auto rounded-3xl bg-white p-5 md:p-7 ${NEO_LIGHT}`}>
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[64px_repeat(5,1fr)] gap-2">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="pb-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--po-text-secondary)]">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[64px_repeat(5,1fr)] gap-2">
            {/* Time axis + shift labels */}
            <div className="relative" style={{ height: ROW_COUNT * ROW_PX }}>
              {HOUR_LABELS.map((label, i) =>
                label ? (
                  <div
                    key={i}
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-semibold tabular-nums text-[var(--po-text-secondary)]"
                    style={{ top: i * ROW_PX }}
                  >
                    {label}
                  </div>
                ) : null
              )}
              {SHIFTS.map((s) => (
                <div
                  key={s.label}
                  className="absolute left-0 -rotate-90 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--po-accent)]"
                  style={{ top: ((s.from + s.to) / 2 - START_MIN) / ROW_MIN * ROW_PX }}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className="relative border-l border-[var(--po-border)]"
                style={{ height: ROW_COUNT * ROW_PX }}
              >
                {/* Shift divider lines */}
                {SHIFTS.slice(1).map((s) => (
                  <div
                    key={s.label}
                    className="absolute inset-x-0 border-t border-dashed border-[var(--po-border)]"
                    style={{ top: (s.from - START_MIN) / ROW_MIN * ROW_PX }}
                  />
                ))}

                {BLOCKS.filter((b) => b.day === dayIdx).map((b, i) => {
                  const top = (rowStart(b.start) - 1) * ROW_PX;
                  const height = (toMin(b.end) - toMin(b.start)) / ROW_MIN * ROW_PX;
                  return (
                    <div
                      key={i}
                      className={`absolute inset-x-0.5 overflow-hidden rounded-lg border px-1.5 py-1 ${HUE_STYLES[b.hue]}`}
                      style={{ top, height: Math.max(height, ROW_PX) }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        {b.code ? (
                          <span className={`rounded px-1 py-0.5 text-[8.5px] font-bold text-white ${HUE_BADGE[b.hue]}`}>
                            {b.code}
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-bold uppercase tracking-wide opacity-70">Event</span>
                        )}
                        {b.group ? <span className="text-[8.5px] font-semibold opacity-60">Nhóm {b.group}</span> : null}
                      </div>
                      {height > ROW_PX * 1.5 ? (
                        <>
                          <p className="mt-1 truncate text-[9.5px] font-bold leading-tight">{b.title}</p>
                          <p className="mt-0.5 truncate text-[8.5px] opacity-70">
                            {b.start}&ndash;{b.end} &middot; {b.room}
                          </p>
                        </>
                      ) : (
                        <p className="truncate text-[9px] font-bold leading-tight">{b.title}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
