import type { ParsedTimetableRow } from "@/lib/office-hours/types";

// Behavior-preserving TypeScript port of the standalone TimeTableScanner.txt
// tool (validated against a real EIU "lịch học" PDF export by the user) —
// same day-column X-clustering + `Phòng:`-anchor row-clustering algorithm,
// same regexes, not a redesign. Client-only (File/ArrayBuffer + pdf.js).

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

function cleanStr(str: string | undefined | null): string {
  if (!str) return "";
  return str.replace(/[\uE000-\uF8FF]/g, " ").replace(/\s+/g, " ").trim();
}

function getDayByX(x: number, dayCols: { name: string; x: number }[]): string {
  if (dayCols.length === 0) return "Chưa rõ";
  for (let i = 0; i < dayCols.length; i++) {
    const leftBound = i === 0 ? 0 : (dayCols[i - 1].x + dayCols[i].x) / 2;
    const rightBound = i === dayCols.length - 1 ? 99999 : (dayCols[i].x + dayCols[i + 1].x) / 2;
    if (x >= leftBound && x < rightBound) return dayCols[i].name;
  }
  return dayCols[0].name;
}

export async function parseTimetablePdf(file: File): Promise<ParsedTimetableRow[]> {
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

  // 1. Locate day-column X-centers from the "Thứ N" / "Chủ Nhật" header labels.
  const dayCols: { name: string; x: number }[] = [];
  for (const day of DAY_NAMES) {
    const found = allTextItems.filter((item) => item.text.startsWith(day));
    if (found.length > 0) {
      const avgX = found.reduce((acc, cur) => acc + cur.x, 0) / found.length;
      dayCols.push({ name: day, x: avgX });
    }
  }
  dayCols.sort((a, b) => a.x - b.x);

  // 2. Anchor each class block on "Phòng:" occurrences, cluster nearby text
  // in the same day-column within a Y window, then regex-extract fields.
  const roomAnchors = allTextItems.filter((item) => item.text.includes("Phòng:"));
  const results: ParsedTimetableRow[] = [];

  for (const anchor of roomAnchors) {
    const day = getDayByX(anchor.x, dayCols);

    const cluster = allTextItems.filter(
      (item) => getDayByX(item.x, dayCols) === day && Math.abs(item.y - anchor.y) <= 130
    );
    cluster.sort((a, b) => b.y - a.y);
    const clusterText = cluster.map((i) => i.text).join(" ");

    let startTime = "";
    let endTime = "";
    const timeMatch = clusterText.match(/([0-2]?\d:[0-5]\d)\s*[^0-9a-zA-Z]{1,8}\s*([0-2]?\d:[0-5]\d)/);
    if (timeMatch) {
      startTime = timeMatch[1];
      endTime = timeMatch[2];
    }

    let subjectCode = "N/A";
    let subjectName = "Chưa nhận diện";
    const codeMatch = clusterText.match(/([A-Z]{3,4}\s*\d{3})/i);
    if (codeMatch) subjectCode = codeMatch[1].toUpperCase();

    const subjectNameMatch = clusterText.match(/([A-Za-zÀ-ỹ\s]{3,60})\s*\(\s*[A-Z]{3,4}\s*\d{3}\s*\)/i);
    if (subjectNameMatch) {
      subjectName = subjectNameMatch[1].trim();
    } else if (codeMatch) {
      const idx = clusterText.indexOf(codeMatch[0]);
      if (idx > 0) {
        const before = clusterText.substring(0, idx).replace(/[()]/g, "").trim();
        if (before.length > 2) subjectName = before;
      }
    }

    let group = "N/A";
    const groupMatch = clusterText.match(/Nhóm:\s*([A-Za-z0-9]+)/i);
    if (groupMatch) group = groupMatch[1];

    let room = "ONLINE / Chưa rõ";
    const roomMatch = clusterText.match(/Phòng:\s*([A-Za-z0-9.\-\s]+?)(?=\s*GV:|\s*Lab|\s*Phòng|\s*ONLINE|\s*\d{1,2}:|$)/i);
    if (roomMatch) room = roomMatch[1].trim();

    let lecturerName = "Chưa rõ";
    const lecturerMatch = clusterText.match(/GV:\s*([A-Za-zÀ-ỹ\s]+?)(?=\s*\d{1,2}:|\s*Lab|\s*Phòng|\s*ONLINE|\s*$)/i);
    if (lecturerMatch) lecturerName = lecturerMatch[1].trim();

    results.push({ day, startTime, endTime, subjectCode, subjectName, group, room, lecturerName });
  }

  // 3. Sort Thứ 2 → Chủ Nhật, then by start time within a day.
  results.sort((a, b) => {
    const valA = DAY_NAME_TO_INDEX[a.day] ?? 99;
    const valB = DAY_NAME_TO_INDEX[b.day] ?? 99;
    if (valA !== valB) return valA - valB;
    return a.startTime.localeCompare(b.startTime);
  });

  return results;
}
