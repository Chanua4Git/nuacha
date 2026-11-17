import raw from '@/data/coparentingSeed.md?raw';
export const CATEGORIES = ['Arrangements', 'Calls', 'Communication', 'Money', 'Court & lawyers', 'Travel & documents', "Child's wellbeing", 'Police'] as const;
const MAP: Record<string, string> = { Money: 'Money', Arrangements: 'Arrangements', Communication: 'Communication', Lawyers: 'Court & lawyers', Court: 'Court & lawyers', Calls: 'Calls', Travel: 'Travel & documents', Documents: 'Travel & documents' };
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
export type SeedEntry = { event_date: string; date_label: string; date_precision: string; phase: string; category: string; title: string; status: string };
/** Best-effort sortable date from labels like "18 Sep 2019", "Feb–Sep 2020", "Christmas 2019". */
export function labelToDate(label: string): { date: string; precision: string } {
  const year = label.match(/(19|20)\d{2}/)?.[0] || '2000';
  const mi = MONTHS.findIndex(m => label.toLowerCase().includes(m));
  const day = label.match(/^(\d{1,2})\b/)?.[1];
  const range = /[–-]/.test(label);
  if (/christmas/i.test(label)) return { date: `${year}-12-25`, precision: 'month' };
  if (mi < 0) return { date: `${year}-01-01`, precision: 'year' };
  const mm = String(mi + 1).padStart(2, '0');
  if (day && !range) return { date: `${year}-${mm}-${day.padStart(2, '0')}`, precision: 'exact' };
  return { date: `${year}-${mm}-${(day || '1').padStart(2, '0')}`, precision: range ? 'range' : 'month' };
}
export function parseSeed(text: string = raw): SeedEntry[] {
  let phase = '';
  const out: SeedEntry[] = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) { phase = line.slice(3).trim(); continue; }
    const m = line.match(/^\d+\.\s+(.+?)(Money|Arrangements|Communication|Lawyers|Calls|Court|Travel|Documents)(.+)$/);
    if (!m) continue;
    const label = m[1].trim(); const title = m[3].replace(/\*\*/g, '').trim();
    const { date, precision } = labelToDate(label);
    out.push({ event_date: date, date_label: label, date_precision: precision, phase, category: MAP[m[2]], title, status: /to confirm|to check/i.test(title) ? 'To confirm' : 'My account' });
  }
  return out;
}
