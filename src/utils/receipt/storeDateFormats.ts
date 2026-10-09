/**
 * Per-store date memory + sense check for scanned receipts.
 *
 * Some tills print 09/10/26 (day/month) and the reader can flip it into
 * 10 Sep. When the user corrects a scanned date to the flipped version,
 * we remember that store ("swap") and apply it to every later scan from it,
 * including old receipts scanned in bulk.
 */
const RULES_KEY = 'nuacha.storeDateRules.v1';
const PENDING_KEY = 'nuacha.pendingOcrDates.v1';

export type StoreDateRule = 'swap' | 'keep';

export function normalizeStore(place: string | null | undefined): string {
  return (place ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(ltd|limited|inc|co|company|the|store|stores)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join(' ');
}

function read<T>(key: string): Record<string, T> {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

/** Flip day and month of a YYYY-MM-DD string when both could be either. */
export function swapDayMonth(ymd: string): string | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const month = +m[2], day = +m[3];
  if (day > 12 || day === month) return null;
  return `${m[1]}-${m[3]}-${m[2]}`;
}

export function getStoreRule(place: string): StoreDateRule | undefined {
  const k = normalizeStore(place);
  return k ? read<StoreDateRule>(RULES_KEY)[k] : undefined;
}

export function setStoreRule(place: string, rule: StoreDateRule) {
  const k = normalizeStore(place);
  if (!k) return;
  const all = read<StoreDateRule>(RULES_KEY);
  all[k] = rule;
  write(RULES_KEY, all);
}

export interface DateAdjustment { date: string; adjusted: boolean; reason?: 'store' | 'future' }

/**
 * Apply store memory, then the sense check (a future date whose flip is
 * not in the future is almost certainly flipped). `today` is YYYY-MM-DD.
 */
export function adjustScannedDate(place: string, ymd: string, today: string): DateAdjustment {
  const flipped = swapDayMonth(ymd);
  if (!flipped) return { date: ymd, adjusted: false };
  if (getStoreRule(place) === 'swap') return { date: flipped, adjusted: true, reason: 'store' };
  if (ymd > today && flipped <= today) return { date: flipped, adjusted: true, reason: 'future' };
  return { date: ymd, adjusted: false };
}

/** Remember what the reader originally said for this store, until saved. */
export function rememberScannedDate(place: string, readerDate: string) {
  const k = normalizeStore(place);
  if (!k) return;
  const all = read<{ d: string; t: number }>(PENDING_KEY);
  all[k] = { d: readerDate, t: Date.now() };
  write(PENDING_KEY, all);
}

/**
 * Call when an expense is saved or edited. If the saved date is the flip of
 * what the reader said, learn "swap"; if it matches the reader, learn "keep".
 */
export function learnFromSavedDate(place: string | null | undefined, savedDate: string | null | undefined) {
  const k = normalizeStore(place);
  if (!k || !savedDate) return;
  const saved = savedDate.slice(0, 10);
  const all = read<{ d: string; t: number }>(PENDING_KEY);
  const p = all[k];
  if (!p || Date.now() - p.t > 7 * 24 * 3600 * 1000) return;
  const flipped = swapDayMonth(p.d);
  if (!flipped) return;
  if (saved === flipped) setStoreRule(place!, 'swap');
  else if (saved === p.d) setStoreRule(place!, 'keep');
}
