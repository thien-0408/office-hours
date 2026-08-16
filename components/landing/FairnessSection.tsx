import Link from "next/link";
import { DarkButton, NEO_LIGHT, NEO_DARK } from "@/components/landing/shared";

const ROTATIONS = ["-rotate-1", "rotate-1", "rotate-1", "-rotate-1"];

const TILES = [
  { label: "FCFS", sub: "First-come, first-served" },
  { label: "Priority", sub: "Weighted by need" },
  { label: "Round-robin", sub: "Rotates fairly" },
  { label: "Hybrid", sub: "Best of all three" },
];

export default function FairnessSection() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
        <div className="w-full text-center md:flex-1 md:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-secondary)]">
            Fairness, not favorites
          </p>
          <h2 className="mt-3 max-w-[16ch] text-balance text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-[var(--po-text-primary)] mx-auto md:mx-0">
            Every Waitlist Decision Is Logged and Reproducible
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] text-[14.5px] leading-[1.65] text-[var(--po-text-primary)]/70 md:mx-0">
            We compare four allocation policies head-to-head so a slot never goes to whoever
            refreshed fastest. Every offer is logged with its policy, score, and seed &mdash; fully
            auditable.
          </p>
          <div className="mt-6">
            <DarkButton href="/public/office-hours">See open slots</DarkButton>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 md:max-w-[400px] md:flex-1">
          {TILES.map((tile, i) => (
            <div
              key={tile.label}
              className={`rounded-2xl p-5 transition-transform hover:-translate-y-0.5 hover:rotate-0 ${ROTATIONS[i]} ${
                i % 2 === 0
                  ? `bg-[var(--po-accent)] text-[var(--po-text-primary)] ${NEO_LIGHT}`
                  : `bg-[var(--po-text-primary)] text-[var(--po-text-tertiary)] ${NEO_DARK}`
              }`}
            >
              <p className="text-[15px] font-extrabold">{tile.label}</p>
              <p className="mt-1 text-[11px] font-semibold opacity-70">{tile.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-center text-[12px] text-[var(--po-text-secondary)]">
        Curious how the policies compare? See the{" "}
        <Link href="/public/office-hours" className="font-bold text-[var(--po-text-primary)] underline underline-offset-2">
          live listing
        </Link>{" "}
        or ask your admin for the research dashboard.
      </p>
    </section>
  );
}
