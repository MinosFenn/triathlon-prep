const TZ = "Europe/Zurich";

/** Today as YYYY-MM-DD in Geneva timezone */
export function getTodayIsoInGeneva(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function parseIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return raw;
}

export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function daysFromToday(iso: string): number {
  const today = getTodayIsoInGeneva();
  const t0 = isoToUtcDay(today);
  const t1 = isoToUtcDay(iso);
  return Math.round((t1 - t0) / 86_400_000);
}

function isoToUtcDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
