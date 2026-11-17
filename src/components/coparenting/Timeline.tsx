import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CAT_VAR: Record<string, string> = {
  Arrangements: '--cp-arr', Calls: '--cp-com', Communication: '--cp-com', Money: '--cp-money',
  'Court & lawyers': '--cp-court', 'Travel & documents': '--cp-travel', Police: '--cp-police', "Child's wellbeing": '--cp-well',
};
export const catColor = (c: string) => `hsl(var(${CAT_VAR[c] || '--muted-foreground'}))`;

export const PHASES = [
  { from: '2000-01-01', to: '2021-04-20', range: '2019 – Apr 2021', title: 'Father in the country, in-person access', note: 'Visits every other day, 3–6 p.m.; disputes through lawyers from Sep 2020.' },
  { from: '2021-04-21', to: '2022-12-31', range: 'Apr 2021 – Sep 2022', title: 'Father leaves; daily video calls begin without an agreed plan', note: 'No plan for long-distance contact is agreed.' },
  { from: '2023-01-01', to: '2024-12-31', range: '2023 – 2024', title: 'Court case opens; a fixed call schedule', note: 'Interim orders set voice and video access pending the probation report.' },
  { from: '2025-01-01', to: '2099-12-31', range: '2025 – 2026', title: 'Final orders and a new application', note: 'Final consent orders in Aug 2025; a new application follows in Oct 2026.' },
];
const COVERAGE: [string, number, number][] = [['Jan–Feb 2024', 12, 18], ['Mar–Dec 2024', 80, 87], ['Jan–Aug 2025', 92, 98], ['Aug–Dec 2025', 32, 51]];

export type TimelineEntry = { id: string; event_date: string; date_label: string | null; category: string; title: string; status: string; is_important?: boolean };

/** Bold the first sentence of important entries. */
function Text({ e }: { e: TimelineEntry }) {
  if (!e.is_important) return <>{e.title}</>;
  const m = e.title.match(/^(.+?[.;:])(\s.*)?$/);
  return m ? <><b className="font-semibold">{m[1]}</b>{m[2]}</> : <b className="font-semibold">{e.title}</b>;
}

export function Timeline({ entries, onOpen, onToggleImportant, readOnly }: { entries: TimelineEntry[]; onOpen: (e: TimelineEntry) => void; onToggleImportant: (e: TimelineEntry) => void; readOnly: boolean }) {
  const [newest, setNewest] = useState(false);
  const sorted = useMemo(() => [...entries].sort((a, b) => newest ? b.event_date.localeCompare(a.event_date) : a.event_date.localeCompare(b.event_date)), [entries, newest]);
  const groups = useMemo(() => {
    const list = PHASES.map(p => ({ ...p, items: sorted.filter(e => e.event_date >= p.from && e.event_date <= p.to) })).filter(g => g.items.length);
    return newest ? list.reverse() : list;
  }, [sorted, newest]);
  const years = [...new Set(sorted.map(e => e.event_date.slice(0, 4)))].sort();
  const firstOfYear = new Set(years.map(y => sorted.find(e => e.event_date.startsWith(y))!.id));

  return <div className="space-y-5">
    <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-1 border-b bg-background/95 px-4 py-2 backdrop-blur print:hidden">
      {years.map(y => <button key={y} className="rounded-md px-2 py-1 text-sm tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => document.getElementById(`cp-year-${y}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{y}</button>)}
      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setNewest(n => !n)}>{newest ? 'Newest first' : 'Oldest first'}</Button>
    </div>
    {groups.map(g => <section key={g.title} className="space-y-2">
      <header className="border-t pt-3">
        <small className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.range}</small>
        <h2 className="font-heading text-lg">{g.title}</h2>
        <p className="text-sm text-muted-foreground">{g.note}</p>
      </header>
      <ol className="relative before:absolute before:bottom-1 before:left-[79px] before:top-1 before:w-0.5 before:bg-border sm:before:left-[101px]">
        {g.items.map(e => <li key={e.id} id={firstOfYear.has(e.id) ? `cp-year-${e.event_date.slice(0, 4)}` : undefined} className="group grid scroll-mt-14 grid-cols-[68px_24px_minmax(0,1fr)] items-start gap-x-0 py-2 sm:grid-cols-[90px_24px_minmax(0,1fr)]">
          <span className="pr-2 pt-0.5 text-right text-[13px] tabular-nums leading-snug text-muted-foreground">{e.date_label || format(new Date(`${e.event_date}T12:00:00`), 'd MMM yyyy')}</span>
          <span className="flex justify-center pt-1.5"><span className="h-3 w-3 rounded-full ring-2 ring-background" style={{ background: catColor(e.category) }} /></span>
          <div className="flex min-w-0 items-start gap-2">
            <button className="min-w-0 flex-1 text-left text-[15px] leading-normal hover:underline hover:decoration-muted-foreground/40" onClick={() => onOpen(e)}>
              <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: catColor(e.category) }}>{e.category}</span>
              <Text e={e} />
              {e.status === 'To confirm' && <span className="ml-1.5 text-xs italic text-muted-foreground">to confirm</span>}
            </button>
            {!readOnly && <button aria-label={e.is_important ? 'Unmark important' : 'Mark important'} aria-pressed={!!e.is_important} onClick={() => onToggleImportant(e)} className={`mt-0.5 shrink-0 rounded p-0.5 print:hidden ${e.is_important ? 'text-foreground' : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}><Star className={`h-4 w-4 ${e.is_important ? 'fill-current' : ''}`} /></button>}
          </div>
        </li>)}
      </ol>
    </section>)}
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="font-heading text-lg">Scheduled call evenings Mother called</h2>
      {COVERAGE.map(([l, n, d]) => <div key={l} className="grid grid-cols-[96px_minmax(0,1fr)_48px] items-center gap-3 text-[13px] sm:grid-cols-[120px_minmax(0,1fr)_56px]">
        <span>{l}</span><span className="h-3 overflow-hidden rounded-full bg-muted"><span className="block h-full" style={{ width: `${(n / d) * 100}%`, background: catColor('Calls') }} /></span><span className="text-right tabular-nums">{n}/{d}</span>
      </div>)}
      <p className="text-xs text-muted-foreground">From phone call history, 29 Dec 2023 – 31 Jan 2026: 429 calls, 266 placed by Mother.</p>
    </section>
  </div>;
}
