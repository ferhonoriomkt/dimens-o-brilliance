export type Scale = "day" | "week" | "month";

export const PX_PER_UNIT: Record<Scale, number> = { day: 36, week: 90, month: 140 };

export const MS_DAY = 86400000;

export function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s + (s.length === 10 ? "T00:00:00" : ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay(); // 0 = sun
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function snapDate(d: Date, scale: Scale): Date {
  if (scale === "day") {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }
  if (scale === "week") return startOfWeek(d);
  return startOfMonth(d);
}

export function unitWidth(scale: Scale, zoom = 1): number {
  return PX_PER_UNIT[scale] * zoom;
}

// Pixel offset (from rangeStart) for a given date at given scale
export function dateToPx(date: Date, rangeStart: Date, scale: Scale, zoom = 1): number {
  const days = diffDays(rangeStart, date);
  const unit = PX_PER_UNIT[scale] * zoom;
  if (scale === "day") return days * unit;
  if (scale === "week") return (days / 7) * unit;
  return (days / 30.4375) * unit;
}

export function pxToDays(px: number, scale: Scale, zoom = 1): number {
  const unit = PX_PER_UNIT[scale] * zoom;
  if (scale === "day") return px / unit;
  if (scale === "week") return (px / unit) * 7;
  return (px / unit) * 30.4375;
}

export function snapPxToDate(px: number, rangeStart: Date, scale: Scale, zoom = 1): Date {
  const days = pxToDays(px, scale, zoom);
  const raw = addDays(rangeStart, Math.round(days));
  return snapDate(raw, scale);
}

export interface TimelineRange {
  start: Date;
  end: Date;
  totalPx: number;
}

export function computeRange(dates: (string | null | undefined)[], scale: Scale, zoom = 1): TimelineRange {
  const parsed = dates.map(parseDate).filter((d): d is Date => !!d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let min = parsed.length ? new Date(Math.min(...parsed.map((d) => d.getTime()))) : addDays(today, -7);
  let max = parsed.length ? new Date(Math.max(...parsed.map((d) => d.getTime()))) : addDays(today, 30);
  // padding
  min = addDays(min, scale === "day" ? -3 : scale === "week" ? -7 : -15);
  max = addDays(max, scale === "day" ? 7 : scale === "week" ? 14 : 30);
  const start = snapDate(min, scale);
  const end = snapDate(max, scale);
  const totalPx = Math.max(dateToPx(end, start, scale, zoom), 600);
  return { start, end, totalPx };
}

// Generate column headers
export interface ColumnHeader {
  label: string;
  groupLabel: string; // month label
  left: number;
  width: number;
}

export function generateColumns(range: TimelineRange, scale: Scale, zoom = 1): { groups: { label: string; left: number; width: number }[]; cells: ColumnHeader[] } {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const cells: ColumnHeader[] = [];
  const unit = (s: Scale) => PX_PER_UNIT[s] * zoom;
  if (scale === "day") {
    let d = new Date(range.start);
    while (d <= range.end) {
      const left = dateToPx(d, range.start, scale, zoom);
      cells.push({
        label: String(d.getDate()),
        groupLabel: `${months[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        left,
        width: unit("day"),
      });
      d = addDays(d, 1);
    }
  } else if (scale === "week") {
    let d = startOfWeek(range.start);
    while (d <= range.end) {
      const left = dateToPx(d, range.start, scale, zoom);
      cells.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        groupLabel: `${months[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        left,
        width: unit("week"),
      });
      d = addDays(d, 7);
    }
  } else {
    let d = startOfMonth(range.start);
    while (d <= range.end) {
      const left = dateToPx(d, range.start, scale, zoom);
      cells.push({
        label: months[d.getMonth()],
        groupLabel: String(d.getFullYear()),
        left,
        width: unit("month"),
      });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }
  // group by groupLabel
  const groups: { label: string; left: number; width: number }[] = [];
  cells.forEach((c) => {
    const last = groups[groups.length - 1];
    if (last && last.label === c.groupLabel) {
      last.width += c.width;
    } else {
      groups.push({ label: c.groupLabel, left: c.left, width: c.width });
    }
  });
  return { groups, cells };
}
