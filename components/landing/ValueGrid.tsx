import { CheckBadge, NEO_LIGHT, NEO_DARK, LimeButton } from "@/components/landing/shared";

type Tone = "lime" | "paper" | "dark";

const CELLS: { title: string; tone: Tone }[] = [
  { title: "One calendar checked against every class schedule", tone: "lime" },
  { title: "One waitlist, offered by a published policy", tone: "paper" },
  { title: "One point of contact for every booking", tone: "lime" },
  { title: "One-click confirm or decline for lecturers", tone: "paper" },
  { title: "One database guard — never a double-booked slot", tone: "lime" },
  { title: "brand", tone: "dark" },
];

const TONE_STYLES: Record<Tone, string> = {
  lime: `bg-[var(--po-accent)] text-[var(--po-text-primary)] ${NEO_LIGHT}`,
  paper: `bg-[var(--po-surface)] text-[var(--po-text-primary)] ${NEO_LIGHT}`,
  dark: `bg-[var(--po-text-primary)] text-[var(--po-text-tertiary)] ${NEO_DARK}`,
};

const ROTATIONS = ["-rotate-1", "rotate-1", "rotate-1", "-rotate-1", "-rotate-1", "rotate-1"];

export default function ValueGrid() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">
        <div className="w-full text-center md:max-w-[340px] md:flex-1 md:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-secondary)]">
            One decision and you&rsquo;re done
          </p>
          <h2 className="mt-3 text-balance text-[clamp(26px,3.4vw,38px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-[var(--po-text-primary)]">
            We Make Booking Office Hours Insanely Simple.
          </h2>
          <div className="mt-6">
            <LimeButton href="/register">Start booking</LimeButton>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 md:max-w-[440px] md:flex-1">
          {CELLS.map((cell, i) =>
            cell.tone === "dark" ? (
              <div
                key="brand"
                className={`flex items-center justify-center rounded-2xl px-4 py-6 text-[15px] font-bold ${TONE_STYLES.dark} ${ROTATIONS[i]} transition-transform hover:-translate-y-0.5 hover:rotate-0`}
              >
                Office<span className="rounded bg-[var(--po-accent)] px-1 py-0.5 text-[var(--po-text-primary)]">Hours</span>
              </div>
            ) : (
              <div
                key={cell.title}
                className={`flex flex-col justify-between rounded-2xl px-4 py-4 ${TONE_STYLES[cell.tone]} ${ROTATIONS[i]} transition-transform hover:-translate-y-0.5 hover:rotate-0`}
              >
                <CheckBadge />
                <p className="mt-4 text-[12.5px] font-bold leading-snug">{cell.title}</p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
