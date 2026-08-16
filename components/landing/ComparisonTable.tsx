import { LimeButton, NEO_LIGHT } from "@/components/landing/shared";

const ROWS = [
  { label: "Setup time", officehours: "Live in a day", email: "Ongoing chaos", spreadsheet: "An afternoon, then upkeep", doorSheet: "None — and that's the problem" },
  { label: "Conflict checking", officehours: "Automatic, every time", email: "Manual, error-prone", spreadsheet: "Manual", doorSheet: "None" },
  { label: "Cost", officehours: "Free", email: "Free (your time)", spreadsheet: "Free (your time)", doorSheet: "Free (your patience)" },
  { label: "Fair waitlist", officehours: "Policy-driven, logged", email: "Whoever replies first", spreadsheet: "Whoever edits first", doorSheet: "Whoever gets there first" },
  { label: "Works from your phone", officehours: "Yes", email: "Sort of", spreadsheet: "Barely", doorSheet: "No" },
] as const;

const COLUMNS = [
  { key: "officehours", label: "OfficeHours", highlight: true },
  { key: "email", label: "Email threads", highlight: false },
  { key: "spreadsheet", label: "Shared spreadsheet", highlight: false },
  { key: "doorSheet", label: "Sign-up sheet on the door", highlight: false },
] as const;

export default function ComparisonTable() {
  return (
    <section id="why-us" className="mx-auto w-full max-w-[1180px] px-6 py-16 md:py-20">
      <div className={`overflow-x-auto rounded-3xl bg-[var(--po-surface)] p-6 md:p-8 ${NEO_LIGHT}`}>
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr>
              <th className="w-[160px] pb-4" />
              {COLUMNS.map((col) => (
                <th key={col.key} className="pb-4 pl-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] ${
                      col.highlight
                        ? "bg-[var(--po-accent)] text-[var(--po-text-primary)]"
                        : "bg-[var(--po-text-primary)] text-[var(--po-text-tertiary)]"
                    }`}
                  >
                    {col.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-[var(--po-border)]">
                <td className="py-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--po-text-secondary)]">
                  {row.label}
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`py-4 pl-4 text-[13px] font-semibold ${
                      col.highlight ? "text-[var(--po-text-primary)]" : "text-[var(--po-text-primary)]/55"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {col.highlight ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--po-accent)]" aria-hidden="true" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--po-text-secondary)]/40" aria-hidden="true" />
                      )}
                      {row[col.key]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 text-center">
        <p className="text-[15px] font-bold text-[var(--po-text-primary)]">
          Ready to stop refreshing your inbox?
        </p>
        <div className="mt-4 flex justify-center">
          <LimeButton href="/register">Get started free</LimeButton>
        </div>
      </div>
    </section>
  );
}
