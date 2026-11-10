export interface PurchaseLine { description: string; date: string; place: string; }
export interface DueHint { key: string; name: string; lastDate: string; lastPlace: string; times: number; avgGapDays: number; daysSince: number; }

const dayNum = (d: string) => {
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, dd) / 86400000);
};
export const itemKey = (s: string) =>
  s.toLowerCase().replace(/[0-9]+(\.[0-9]+)?\s*(ml|l|g|kg|oz|lb|ct|pk|x)\b/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Items bought on 3+ separate days whose usual gap has passed. */
export function dueHints(lines: PurchaseLine[], today: string): DueHint[] {
  const groups = new Map<string, PurchaseLine[]>();
  for (const l of lines) {
    if (!l.description || !/^\d{4}-\d{2}-\d{2}/.test(l.date)) continue;
    const k = itemKey(l.description);
    if (k.length < 3) continue;
    groups.set(k, [...(groups.get(k) || []), l]);
  }
  const t = dayNum(today);
  const out: DueHint[] = [];
  for (const [key, ls] of groups) {
    const days = [...new Set(ls.map(l => dayNum(l.date)))].sort((a, b) => a - b);
    if (days.length < 3) continue;
    const avg = Math.round((days[days.length - 1] - days[0]) / (days.length - 1));
    const last = days[days.length - 1];
    const daysSince = t - last;
    if (avg < 1 || daysSince < avg) continue;
    const lastLine = ls.find(l => dayNum(l.date) === last)!;
    out.push({ key, name: lastLine.description, lastDate: lastLine.date.slice(0, 10), lastPlace: lastLine.place, times: days.length, avgGapDays: avg, daysSince });
  }
  return out.sort((a, b) => b.daysSince / b.avgGapDays - a.daysSince / a.avgGapDays);
}
