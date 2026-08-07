const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// Coarse relative-time label (minutes/hours/days) for notification and
// timeline timestamps — precise enough for a demo without a library.
export function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - new Date().getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}
