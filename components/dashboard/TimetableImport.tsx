"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, XCircle } from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import type { ParsedTimetableRow, ScheduleImportHistoryEntry } from "@/lib/office-hours/types";
import { DAY_NAME_TO_INDEX, parseTimetablePdf, type TimetableMetadata } from "@/lib/timetable/parse-pdf";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// Shared uploader for an official AAO timetable export — used both by a
// self-service upload (student/lecturer importing their own timetable) and
// by Admin's on-behalf-of upload (Pages.txt #24). Trust doesn't depend on
// who uploads: the parser only accepts genuine AAO exports either way
// (docs/capstone-officehours-plan.md §5.1, capstone-api-endpoints.md §4).
// `buildEntry` is the only per-caller difference — it maps a parsed row to
// that caller's entry shape (plain ScheduleBlock for self-service,
// AdminScheduleEntry with a lecturerName for admin's cross-lecturer view).
type ParseStatus = "idle" | "parsing" | "done" | "error";

export function TimetableImport<T extends { id: number }>({
  entries,
  setEntries,
  history,
  setHistory,
  buildEntry,
  heading = "Upload a timetable PDF",
  description = 'Parses an EIU "lịch học" export entirely in your browser (day-column + room-anchor clustering) — nothing is uploaded to a server.',
}: {
  entries: T[];
  setEntries: React.Dispatch<React.SetStateAction<T[]>>;
  history: ScheduleImportHistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<ScheduleImportHistoryEntry[]>>;
  buildEntry: (row: ParsedTimetableRow, dayOfWeek: number, id: number) => T;
  heading?: string;
  description?: string;
}) {
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedTimetableRow[]>([]);
  const [metadata, setMetadata] = useState<TimetableMetadata | null>(null);
  const [imported, setImported] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus("parsing");
    setImported(false);
    try {
      const parsed = await parseTimetablePdf(file);
      setRows(parsed.rows);
      setMetadata(parsed.metadata);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setRows([]);
      setMetadata(null);
      setStatus("error");
    }
  }

  function handleImport() {
    const importable = rows.filter((r) => DAY_NAME_TO_INDEX[r.day] >= 1 && DAY_NAME_TO_INDEX[r.day] <= 5);
    const startId = entries.length === 0 ? 1 : Math.max(...entries.map((e) => e.id)) + 1;
    const newEntries = importable.map((r, i) => buildEntry(r, DAY_NAME_TO_INDEX[r.day], startId + i));
    setEntries((list) => [...list, ...newEntries]);

    const nextHistoryId = history.length === 0 ? 1 : Math.max(...history.map((h) => h.id)) + 1;
    setHistory((list) => [
      { id: nextHistoryId, fileName: fileName ?? "unknown.pdf", importedAt: new Date().toISOString(), rowCount: newEntries.length, status: "SUCCESS" },
      ...list,
    ]);
    setImported(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title={heading} />
        <p className="text-[12.5px] text-[var(--ink-500)] bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-lg px-3.5 py-2.5 mb-4 flex items-center gap-2">
          <FileUp className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          {description}
        </p>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--brand-200)] bg-[var(--brand-50)] rounded-xl px-6 py-8 cursor-pointer hover:bg-[var(--brand-100)] transition-colors">
          <FileUp className="w-6 h-6 text-[var(--brand-500)]" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-[var(--brand-700)]">Click to choose a PDF timetable</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
        </label>

        {status === "parsing" && <p className="text-[13px] text-[var(--ink-600)] mt-3">Parsing {fileName}…</p>}
        {status === "error" && (
          <p className="text-[13px] text-[var(--danger-700)] font-semibold mt-3">Couldn&apos;t parse that file. Try another PDF.</p>
        )}
        {status === "done" && (
          <>
            <p className="text-[13px] text-[var(--success-700)] font-semibold mt-3">
              Parsed {rows.length} class session{rows.length === 1 ? "" : "s"} from {fileName}.
            </p>
            {(metadata?.name || metadata?.semester) && (
              <p className="text-[12.5px] text-[var(--ink-500)] mt-1">
                Detected in PDF:{" "}
                {metadata.name && <span className="font-semibold text-[var(--ink-700)]">{metadata.name}</span>}
                {metadata.name && metadata.semester && " · "}
                {metadata.semester && <span className="font-semibold text-[var(--ink-700)]">{metadata.semester}</span>}
              </p>
            )}
          </>
        )}
      </Card>

      {status === "done" && rows.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Preview" />
            <button
              type="button"
              onClick={handleImport}
              disabled={imported}
              className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {imported ? "Imported" : `Import ${rows.length} entries`}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Group</th>
                  <th className="py-2 pr-4">Room</th>
                  <th className="py-2 pr-4">Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--paper-100)] last:border-0">
                    <td className="py-2 pr-4 font-semibold text-[var(--brand-700)] whitespace-nowrap">
                      {row.day}
                      {row.date && <span className="text-[var(--ink-500)] font-normal"> ({row.date})</span>}
                    </td>
                    <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                      {row.startTime || "?"}–{row.endTime || "?"}
                    </td>
                    <td className="py-2 pr-4">
                      <p className="font-semibold text-[var(--ink-900)]">{row.subjectCode}</p>
                      <p className="text-[12px] text-[var(--ink-500)]">{row.subjectName}</p>
                    </td>
                    <td className="py-2 pr-4">{row.group}</td>
                    <td className="py-2 pr-4">{row.room}</td>
                    <td className="py-2 pr-4">{row.lecturerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div>
        <SectionHeader title="Import history" />
        {history.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-[var(--ink-500)]">No imports yet.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                  <th className="px-5 py-3">File</th>
                  <th className="px-5 py-3">Imported</th>
                  <th className="px-5 py-3">Rows</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-[var(--paper-100)] last:border-0">
                    <td className="px-5 py-3 font-medium text-[var(--ink-900)]">{h.fileName}</td>
                    <td className="px-5 py-3 tabular-nums text-[var(--ink-600)]">{dateTimeFormatter.format(new Date(h.importedAt))}</td>
                    <td className="px-5 py-3 tabular-nums">{h.rowCount}</td>
                    <td className="px-5 py-3">
                      {h.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1.5 text-[var(--success-700)] font-semibold text-[12.5px]">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[var(--danger-700)] font-semibold text-[12.5px]">
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2} /> Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

export function ScheduleSourceBadge({ source }: { source: "IMPORTED" | "MANUAL" }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wide bg-[var(--paper-100)] text-[var(--ink-500)]">
      {source === "IMPORTED" ? "Imported" : "Manual"}
    </span>
  );
}
