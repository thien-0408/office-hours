import Image from "next/image";
import { memojiSrc } from "@/lib/avatar";
import { NEO_ON_DARK_LIGHT, NEO_ON_DARK_GLASS } from "@/components/landing/shared";

export default function StatsBento() {
  return (
    <section className="bg-[var(--po-text-primary)] py-16 md:py-20">
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-secondary)]">
          Built on the data, not vibes
        </p>
        <h2 className="mt-3 max-w-[20ch] text-balance text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-[var(--po-text-tertiary)]">
          Why Departments Trust OfficeHours With Their First Impression
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className={`col-span-2 flex flex-col justify-between rounded-2xl bg-[var(--po-accent)] p-6 md:col-span-1 ${NEO_ON_DARK_LIGHT}`}>
            <p className="text-[38px] font-extrabold leading-none text-[var(--po-text-primary)]">0</p>
            <p className="mt-3 text-[12.5px] font-bold text-[var(--po-text-primary)]">
              Double-bookings possible &mdash; enforced by a database constraint, not app code
            </p>
          </div>

          <div className={`flex flex-col justify-between rounded-2xl bg-white/[0.06] p-5 ${NEO_ON_DARK_GLASS}`}>
            <p className="text-[12px] font-bold text-white">This week</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {["Mon 11:30", "Wed 14:00", "Fri 09:00"].map((slot) => (
                <div key={slot} className="rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[10.5px] font-semibold text-white/70">
                  {slot}
                </div>
              ))}
            </div>
          </div>

          <div className={`flex flex-col justify-between rounded-2xl bg-white/[0.06] p-5 ${NEO_ON_DARK_GLASS}`}>
            <div className="flex -space-x-2">
              {["bento-1", "bento-2", "bento-3"].map((seed) => (
                <Image
                  key={seed}
                  src={memojiSrc(seed)}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-[var(--po-text-primary)]"
                />
              ))}
            </div>
            <p className="mt-3 text-[12px] font-bold text-white">480+ lecturers onboard</p>
          </div>

          <div className={`flex flex-col justify-between rounded-2xl bg-[var(--po-accent)] p-6 ${NEO_ON_DARK_LIGHT}`}>
            <p className="text-[38px] font-extrabold leading-none text-[var(--po-text-primary)]">12k+</p>
            <p className="mt-3 text-[12.5px] font-bold text-[var(--po-text-primary)]">
              Slots booked conflict-free this year
            </p>
          </div>

          <div className={`flex flex-col justify-between rounded-2xl bg-white/[0.06] p-5 md:col-span-2 ${NEO_ON_DARK_GLASS}`}>
            <p className="text-[12px] font-bold text-white">Waitlist, in order</p>
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[10.5px] font-semibold text-white/70">
                <span>#1 M. Webb</span>
                <span className="text-[var(--po-accent)]">Offered</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[10.5px] font-semibold text-white/70">
                <span>#2 A. Chen</span>
                <span>Waiting</span>
              </div>
            </div>
          </div>

          <div className={`col-span-2 flex flex-col justify-between rounded-2xl bg-[var(--po-accent)] p-6 md:col-span-1 ${NEO_ON_DARK_LIGHT}`}>
            <p className="text-[38px] font-extrabold leading-none text-[var(--po-text-primary)]">4</p>
            <p className="mt-3 text-[12.5px] font-bold text-[var(--po-text-primary)]">
              Allocation policies compared head-to-head, fully reproducible
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
