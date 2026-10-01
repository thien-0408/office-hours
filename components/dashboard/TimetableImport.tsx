"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  FileUp,
  Layers,
  RefreshCw,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import type { ParsedTimetableRow, ScheduleImportHistoryEntry, ScheduleImportMode } from "@/lib/office-hours/types";
import { DAY_NAME_TO_INDEX, parseTimetablePdf, type TimetableMetadata } from "@/lib/timetable/parse-pdf";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterTabs } from "./FilterTabs";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

type ParseStatus = "idle" | "parsing" | "done" | "error";
type ImportMode = ScheduleImportMode;

interface ParsedFileSummary {
  fileName: string;
  rowCount: number;
  metadata: TimetableMetadata;
  rows: ParsedTimetableRow[];
}

export function TimetableImport<T extends { id: number; source?: "IMPORTED" | "MANUAL"; dayOfWeek?: number; startTime?: string; endTime?: string; title?: string; subjectCode?: string }>({
  entries,
  setEntries,
  history,
  setHistory,
  buildEntry,
  heading = "Upload timetable PDF(s)",
  description = 'Parses official AAO "lịch học" exports entirely in your browser. Supports single or multiple PDF files.',
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
  const [parsedFiles, setParsedFiles] = useState<ParsedFileSummary[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>("REPLACE");
  const [imported, setImported] = useState(false);
  const [importResultSummary, setImportResultSummary] = useState<string | null>(null);

  // All parsed rows across all selected files
  const allRows = parsedFiles.flatMap((f) => f.rows);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setStatus("parsing");
    setImported(false);
    setImportResultSummary(null);

    try {
      const results: ParsedFileSummary[] = [];
      for (const file of files) {
        const parsed = await parseTimetablePdf(file);
        results.push({
          fileName: file.name,
          rowCount: parsed.rows.length,
          metadata: parsed.metadata,
          rows: parsed.rows,
        });
      }
      setParsedFiles(results);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setParsedFiles([]);
      setStatus("error");
    }
  }

  function handleImport() {
    if (allRows.length === 0) return;

    // Filter valid days (1=Mon to 7=Sun)
    const validRows = allRows.filter(
      (r) => DAY_NAME_TO_INDEX[r.day] >= 1 && DAY_NAME_TO_INDEX[r.day] <= 7
    );

    let startId = entries.length === 0 ? 1 : Math.max(...entries.map((e) => e.id)) + 1;
    let finalEntries: T[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    if (importMode === "REPLACE") {
      // Keep manual blocks, replace all previous imported entries
      const manualOnly = entries.filter((e) => e.source === "MANUAL");
      const newEntries = validRows.map((r, i) => buildEntry(r, DAY_NAME_TO_INDEX[r.day], startId + i));
      finalEntries = [...manualOnly, ...newEntries];
      addedCount = newEntries.length;
    } else {
      // MERGE & Deduplicate
      const existingEntries = [...entries];
      const newUniqueEntries: T[] = [];

      for (const row of validRows) {
        const dayNum = DAY_NAME_TO_INDEX[row.day];
        // Check if an identical entry already exists
        const isDuplicate = existingEntries.some((existing) => {
          const sameDay = existing.dayOfWeek === dayNum;
          const sameTime = existing.startTime === row.startTime && existing.endTime === row.endTime;
          const sameSubject =
            existing.subjectCode === row.subjectCode ||
            existing.title?.includes(row.subjectCode) ||
            existing.title?.includes(row.subjectName);
          return sameDay && sameTime && sameSubject;
        });

        if (isDuplicate) {
          skippedCount++;
        } else {
          const entry = buildEntry(row, dayNum, startId++);
          newUniqueEntries.push(entry);
          existingEntries.push(entry);
          addedCount++;
        }
      }

      finalEntries = existingEntries;
    }

    setEntries(finalEntries);

    // Record to history
    let nextHistId = history.length === 0 ? 1 : Math.max(...history.map((h) => h.id)) + 1;
    const historyEntries: ScheduleImportHistoryEntry[] = parsedFiles.map((file) => ({
      id: nextHistId++,
      fileName: file.fileName,
      importedAt: new Date().toISOString(),
      rowCount: file.rows.length,
      status: "SUCCESS",
    }));

    setHistory((prev) => [...historyEntries, ...prev]);
    setImported(true);

    if (skippedCount > 0) {
      setImportResultSummary(`Imported ${addedCount} new sessions (${skippedCount} duplicate sessions skipped).`);
    } else {
      setImportResultSummary(`Successfully imported ${addedCount} class sessions.`);
    }
  }

  function handleClearImported() {
    setEntries((list) => list.filter((e) => e.source === "MANUAL"));
    setImportResultSummary("All imported schedule blocks have been cleared.");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title={heading} />
        <p className="text-[12.5px] text-[var(--ink-500)] bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-lg px-3.5 py-2.5 mb-4 flex items-center gap-2">
          <FileUp className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          {description}
        </p>

        {/* Dropzone with multiple file support */}
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--brand-200)] bg-[var(--brand-50)] rounded-xl px-6 py-8 cursor-pointer hover:bg-[var(--brand-100)] transition-colors">
          <FileUp className="w-6 h-6 text-[var(--brand-500)]" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-[var(--brand-700)]">
            Click to choose PDF timetable(s)
          </span>
          <span className="text-xs text-[var(--ink-500)]">
            You can select multiple PDF files at once (e.g. lectures + labs)
          </span>
          <input
            type="file"
            accept=".pdf"
            multiple
            hidden
            onChange={handleFilesChange}
          />
        </label>

        {status === "parsing" && (
          <p className="text-[13px] text-[var(--ink-600)] mt-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--brand-500)]" />
            Parsing timetable files…
          </p>
        )}

        {status === "error" && (
          <p className="text-[13px] text-[var(--danger-700)] font-semibold mt-3">
            Couldn&apos;t parse one or more files. Please ensure you uploaded genuine AAO timetable PDFs.
          </p>
        )}

        {status === "done" && parsedFiles.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 p-3 bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink-800)]">
                Parsed {parsedFiles.length} file{parsedFiles.length === 1 ? "" : "s"} ({allRows.length} total sessions):
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {parsedFiles.map((pf, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[var(--paper-200)] text-xs text-[var(--ink-700)] shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--brand-500)] shrink-0" />
                  <span className="font-semibold">{pf.fileName}</span>
                  <span className="text-[var(--ink-400)]">({pf.rowCount} classes)</span>
                  {pf.metadata?.name && (
                    <span className="text-[var(--brand-600)] text-[11px]">· {pf.metadata.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Preview & Import Options */}
      {status === "done" && allRows.length > 0 && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[var(--paper-100)]">
            <div>
              <SectionHeader title="Import Strategy & Preview" />
              <p className="text-xs text-[var(--ink-500)] mt-0.5">
                Choose how these {allRows.length} session blocks should be combined with your existing schedule.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Import Mode Selector */}
              <FilterTabs
                variant="paper"
                value={importMode}
                onChange={setImportMode}
                options={[
                  {
                    value: "REPLACE",
                    label: "Replace Old",
                    icon: <Layers className="w-3.5 h-3.5 text-[var(--brand-500)]" />,
                    title: "Overwrites old imported sessions with the new PDF, keeping manual notes",
                  },
                  {
                    value: "MERGE",
                    label: "Merge & Deduplicate",
                    icon: <Sparkles className="w-3.5 h-3.5 text-[var(--coral-500)]" />,
                    title: "Appends new classes and automatically filters out exact duplicates",
                  },
                ]}
              />

              <Button
                type="button"
                onClick={handleImport}
                disabled={imported}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {imported ? "Imported to Timetable" : `Confirm Import (${allRows.length} rows)`}
              </Button>
            </div>
          </div>

          {importResultSummary && (
            <div className="mb-4 p-3 bg-[var(--success-100)] text-[var(--success-700)] text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {importResultSummary}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                  <TableHead className="py-2 pr-4">Day</TableHead>
                  <TableHead className="py-2 pr-4">Time</TableHead>
                  <TableHead className="py-2 pr-4">Subject</TableHead>
                  <TableHead className="py-2 pr-4">Group</TableHead>
                  <TableHead className="py-2 pr-4">Room</TableHead>
                  <TableHead className="py-2 pr-4">Lecturer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRows.map((row, i) => (
                  <TableRow key={i}
                  className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)]">
                    <TableCell className="py-2 pr-4 font-semibold text-[var(--brand-700)] whitespace-nowrap">
                      {row.day}
                      {row.date && <span className="text-[var(--ink-500)] font-normal"> ({row.date})</span>}
                    </TableCell>
                    <TableCell className="py-2 pr-4 tabular-nums whitespace-nowrap">
                      {row.startTime || "?"}–{row.endTime || "?"}
                    </TableCell>
                    <TableCell className="py-2 pr-4">
                      <p className="font-semibold text-[var(--ink-900)]">{row.subjectCode}</p>
                      <p className="text-[12px] text-[var(--ink-500)]">{row.subjectName}</p>
                    </TableCell>
                    <TableCell className="py-2 pr-4">{row.group}</TableCell>
                    <TableCell className="py-2 pr-4 font-medium">{row.room}</TableCell>
                    <TableCell className="py-2 pr-4 text-[var(--ink-600)]">{row.lecturerName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Import History Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionHeader title="Import history" />
          {entries.some((e) => e.source === "IMPORTED") && (
            <Button
              type="button"
              variant="ghost-danger"
              size="sm"
              onClick={handleClearImported}
              className="text-[var(--danger-700)]"
            >
              <Trash2 className="w-3 h-3" />
              Clear imported schedule
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-[var(--ink-500)]">No imports recorded yet.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                  <TableHead className="px-5 py-3">File</TableHead>
                  <TableHead className="px-5 py-3">Imported</TableHead>
                  <TableHead className="px-5 py-3">Rows</TableHead>
                  <TableHead className="px-5 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}
                  className="border-b border-[var(--paper-100)] last:border-0">
                    <TableCell className="px-5 py-3 font-medium text-[var(--ink-900)] flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[var(--brand-500)]" />
                      {h.fileName}
                    </TableCell>
                    <TableCell className="px-5 py-3 tabular-nums text-[var(--ink-600)]">
                      {dateTimeFormatter.format(new Date(h.importedAt))}
                    </TableCell>
                    <TableCell className="px-5 py-3 tabular-nums">{h.rowCount} classes</TableCell>
                    <TableCell className="px-5 py-3">
                      {h.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1.5 text-[var(--success-700)] font-semibold text-[12.5px]">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[var(--danger-700)] font-semibold text-[12.5px]">
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2} /> Failed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
