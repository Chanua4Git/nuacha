import { format } from 'date-fns';

/**
 * Receipt dates are calendar days, not moments in time.
 * Always read them through this helper so a time-zone difference
 * (e.g. "2026-10-08T00:00:00Z" seen from Trinidad, UTC-4) can never
 * turn the 8th into the 7th.
 */
export function parseReceiptCalendarDate(value: unknown): Date | undefined {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'object' && 'value' in (value as any)) {
    return parseReceiptCalendarDate((value as any).value);
  }
  if (typeof value !== 'string') return undefined;
  const s = value.trim();

  // Any ISO-like string: take the printed calendar day and ignore time / zone.
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return build(+iso[1], +iso[2], +iso[3]);

  // DD/MM/YYYY (Trinidad & Tobago order); MM/DD only when the second number can't be a month.
  const parts = s.split(/[\/\-.\s]+/);
  if (parts.length === 3 && parts.every((p) => /^\d+$/.test(p))) {
    let day = +parts[0];
    let month = +parts[1];
    const year = parts[2].length === 2 ? 2000 + +parts[2] : +parts[2];
    if (month > 12 && day <= 12) [day, month] = [month, day];
    return build(year, month, day);
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function build(y: number, m: number, d: number): Date | undefined {
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return undefined;
  return dt;
}

/** Format a calendar day as YYYY-MM-DD using local parts (never toISOString). */
export function toCalendarString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Normalize any receipt date value straight to a YYYY-MM-DD string. */
export function receiptDateString(value: unknown): string | null {
  const d = parseReceiptCalendarDate(value);
  return d ? toCalendarString(d) : null;
}
