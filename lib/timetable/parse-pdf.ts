import type { ParsedTimetableRow } from "@/lib/office-hours/types";

// Behavior-preserving TypeScript port of the standalone TimeTableScanner.txt
// tool (user-updated "Fix Thứ 2 & Trích Xuất Chuẩn" revision) — same regexes,
// same day-column + room-anchor clustering algorithm, not a redesign.
// Client-only (File/ArrayBuffer + pdf.js).
//
// The Monday ("Thứ 2") fix, ported faithfully: the previous version resolved
// a text item's day column by splitting the page into left/right midpoint
// bands, which let the leftmost vertical time-axis ruler (whose X sits left
// of every real day column) get assigned to "Thứ 2" — polluting that day's
// room-anchor clusters with ruler text. The updated tool instead (a) finds
// the *closest* day-column center by absolute distance, and (b) excludes
// anything left of `dayCols[0].x - 30` outright (the ruler zone) before it
// ever reaches clustering. Both parts are required together — nearest-center
// alone still lets ruler text nearest to day 1 leak in.

interface TextItem {
  text: string;
  x: number;
  y: number;
}

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

// Maps the scanned Vietnamese day label to the app's 1=Mon..5=Fri convention
// (RecurringBookingClient/AvailabilityRule) — Sat/Sun (6/7) fall outside that
// range since office hours don't run on weekends in this dataset; callers
// filter those out before importing into AdminScheduleEntry.
export const DAY_NAME_TO_INDEX: Record<string, number> = {
  "Thứ 2": 1,
  "Thứ 3": 2,
  "Thứ 4": 3,
  "Thứ 5": 4,
  "Thứ 6": 5,
  "Thứ 7": 6,
  "Chủ Nhật": 7,
};

// Metadata line scanned off the PDF's header text (student/semester banner) —
// shown to the admin as a "here's what we detected" confirmation before
// import, not persisted anywhere.
export interface TimetableMetadata {
  name: string | null;
  semester: string | null;
}

export interface ParsedTimetableResult {
  metadata: TimetableMetadata;
  rows: ParsedTimetableRow[];
}

function cleanStr(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .normalize("NFC")
    .replace(/[\uE000-\uF8FF]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getDayByX(x: number, dayCols: { name: string; x: number }[], rulerMaxX: number): string | null {
  if (dayCols.length === 0) return null;
  if (x < rulerMaxX) return null; // the ruler-column exclusion — see file header note

  let closestDay = dayCols[0].name;
  let minDiff = Math.abs(x - dayCols[0].x);
  for (let i = 1; i < dayCols.length; i++) {
    const diff = Math.abs(x - dayCols[i].x);
    if (diff < minDiff) {
      minDiff = diff;
      closestDay = dayCols[i].name;
    }
  }
  return closestDay;
}

export async function parseTimetablePdf(file: File): Promise<ParsedTimetableResult> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allTextItems: TextItem[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const text = cleanStr(item.str);
      if (!text) continue;
      allTextItems.push({ text, x: Math.round(item.transform[4]), y: Math.round(item.transform[5]) });
    }
  }

  // 1. Metadata — student/semester banner line, informational only.
  const fullString = allTextItems.map((i) => i.text).join(" ");
  const nameMatch = fullString.match(/Sinh\s*viên:\s*([^|\r\n]+)/i);
  const semesterMatch = fullString.match(/(Học\s*kỳ\s*\d+\s*-\s*Năm\s*học\s*[\d\s-]+)/i);
  const metadata: TimetableMetadata = {
    name: nameMatch ? nameMatch[1].trim() : null,
    semester: semesterMatch ? semesterMatch[1].trim() : null,
  };

  // 2. Locate day-column X-centers from the "Thứ N" / "Chủ Nhật" header labels.
  const dayCols: { name: string; x: number }[] = [];
  for (const day of DAY_NAMES) {
    const found = allTextItems.filter((item) => item.text.startsWith(day));
    if (found.length > 0) {
      const avgX = found.reduce((acc, cur) => acc + cur.x, 0) / found.length;
      dayCols.push({ name: day, x: avgX });
    }
  }
  dayCols.sort((a, b) => a.x - b.x);
  const rulerMaxX = dayCols.length > 0 ? dayCols[0].x - 30 : -Infinity;

  // 2b. Each day column header carries its calendar date in parentheses right
  // next to the day name (e.g. "Thứ 2" ... "(03/08)") — nearest-x match onto
  // dayCols, same as data rows below. First match wins (the header repeats
  // identically on every page).
  const dayDateByName: Record<string, string> = {};
  const dateHeaderItems = allTextItems.filter((item) => /^\(\s*\d{1,2}\/\d{1,2}\s*\)$/.test(item.text));
  for (const item of dateHeaderItems) {
    if (dayCols.length === 0) break;
    let closestDay = dayCols[0].name;
    let minDiff = Math.abs(item.x - dayCols[0].x);
    for (const col of dayCols) {
      const diff = Math.abs(item.x - col.x);
      if (diff < minDiff) {
        minDiff = diff;
        closestDay = col.name;
      }
    }
    if (!dayDateByName[closestDay]) {
      const dateMatch = item.text.match(/(\d{1,2}\/\d{1,2})/);
      if (dateMatch) dayDateByName[closestDay] = dateMatch[1];
    }
  }

  // 3. Resolve every item's day column up front (ruler-excluded), so
  // clustering below only ever sees text that's actually inside a day
  // column — this is the part of the fix that keeps ruler text out of
  // Monday's clusters specifically.
  const validItems = allTextItems
    .map((item) => ({ ...item, day: getDayByX(item.x, dayCols, rulerMaxX) }))
    .filter((item): item is TextItem & { day: string } => item.day !== null);

  // 4. Anchor each class block on "Phòng:" occurrences, cluster nearby text
  // in the same day-column within a Y window, then regex-extract fields.
  const roomAnchors = validItems.filter((item) => item.text.includes("Phòng:"));
  const rows: ParsedTimetableRow[] = [];

  for (const anchor of roomAnchors) {
    const day = anchor.day;

    const cluster = validItems.filter((item) => item.day === day && Math.abs(item.y - anchor.y) <= 110);
    cluster.sort((a, b) => b.y - a.y);
    const clusterText = cluster.map((i) => i.text).join(" ");

    let startTime = "";
    let endTime = "";
    const timeMatches = [...clusterText.matchAll(/([0-2]?\d:[0-5]\d)\s*(?:->|-)\s*([0-2]?\d:[0-5]\d)/g)];
    if (timeMatches.length > 0) {
      startTime = timeMatches[0][1];
      endTime = timeMatches[0][2];
    }

    let subjectCode = "N/A";
    let subjectName = "Chưa nhận diện";

    // Excludes LAB/ROOM/PHONG prefixes (e.g. "LAB405") from being mistaken
    // for a subject code — those are 3 letters + 3 digits too.
    const codeMatch = clusterText.match(/\b(?!(?:LAB|ROOM|PHONG)\b)([A-Z]{3,4}\s*\d{3})\b/i);
    if (codeMatch) subjectCode = codeMatch[1].toUpperCase();

    // Everything before the first of: "(CODE)", bare CODE, "Nhóm:", "Phòng:".
    const namePartMatch = clusterText.match(
      /^(.+?)(?=\s*\(\s*[A-Z]{3,4}\s*\d{3}\s*\)|\s*\b[A-Z]{3,4}\s*\d{3}\b|\s*Nhóm:|\s*Phòng:)/i
    );
    if (namePartMatch) {
      subjectName = namePartMatch[1].trim();
    } else {
      const firstItem = cluster.find((i) => !i.text.startsWith("Nhóm:") && !i.text.startsWith("Phòng:"));
      if (firstItem) {
        subjectName = firstItem.text.replace(/\(\s*[A-Z]{3,4}\s*\d{3}\s*\)/gi, "").trim();
      }
    }

    let group = "N/A";
    const groupMatch = clusterText.match(/Nhóm:\s*([A-Za-z0-9]+)/i);
    if (groupMatch) group = groupMatch[1];

    let room = "ONLINE / Chưa rõ";
    const roomMatch = clusterText.match(/Phòng:\s*([A-Za-z0-9.\-\s]+?)(?=\s*GV:|\s*Lab|\s*Phòng|\s*ONLINE|\s*\d{1,2}:|$)/i);
    if (roomMatch) room = roomMatch[1].replace(/[\s-]+$/, "").trim();

    let lecturerName = "Chưa rõ";
    const lecturerMatch = clusterText.match(/GV:\s*([A-Za-zÀ-ỹ\s]+?)(?=\s*\d{1,2}:|\s*Lab|\s*Phòng|\s*ONLINE|\s*$)/i);
    if (lecturerMatch) lecturerName = lecturerMatch[1].trim();

    rows.push({ day, date: dayDateByName[day] ?? null, startTime, endTime, subjectCode, subjectName, group, room, lecturerName });
  }

  // 5. Sort Thứ 2 → Chủ Nhật, then by start time within a day.
  rows.sort((a, b) => {
    const valA = DAY_NAME_TO_INDEX[a.day] ?? 99;
    const valB = DAY_NAME_TO_INDEX[b.day] ?? 99;
    if (valA !== valB) return valA - valB;
    return a.startTime.localeCompare(b.startTime);
  });

  return { metadata, rows };
}
