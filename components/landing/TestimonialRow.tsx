import Image from "next/image";
import { memojiSrc } from "@/lib/avatar";
import { NEO_LIGHT } from "@/components/landing/shared";

const ROTATIONS = ["-rotate-1", "rotate-1", "-rotate-1", "rotate-1"];

const TESTIMONIALS = [
  { quote: "They took my inbox from chaos to “why didn't we do this sooner.”", name: "Priya Nair", role: "Junior, Computer Science", seed: "testi-1" },
  { quote: "The waitlist actually feels fair. I can see exactly why I got offered a slot.", name: "Marcus Webb", role: "Sophomore, Economics", seed: "testi-2" },
  { quote: "No more double-booked students. Confirming takes ten seconds now.", name: "Dr. Elena Ruiz", role: "Lecturer, Biology", seed: "testi-3" },
  { quote: "Rolled it out to the whole department in a week. Zero complaints.", name: "Prof. Sam Okafor", role: "Department Chair, Engineering", seed: "testi-4" },
];

export default function TestimonialRow() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            className={`flex flex-col justify-between rounded-2xl bg-[var(--po-surface)] p-5 transition-transform hover:-translate-y-0.5 hover:rotate-0 ${ROTATIONS[i]} ${NEO_LIGHT}`}
          >
            <span className="text-[26px] font-black leading-none text-[var(--po-accent)]" style={{ WebkitTextStroke: "1.5px var(--po-text-primary)" }} aria-hidden="true">
              &rdquo;
            </span>
            <p className="mt-2 text-[13.5px] font-semibold leading-snug text-[var(--po-text-primary)]">{t.quote}</p>
            <div className="mt-5 flex items-center gap-2.5">
              <Image src={memojiSrc(t.seed)} alt="" width={32} height={32} className="rounded-full" />
              <div>
                <p className="text-[12px] font-bold text-[var(--po-text-primary)]">{t.name}</p>
                <p className="text-[11px] text-[var(--po-text-secondary)]">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
