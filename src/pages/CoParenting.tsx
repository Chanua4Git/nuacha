import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIES } from '@/utils/coparentingSeed';
import { CoParentingWelcome, CoParentingDisclaimer } from '@/components/coparenting/CoParentingWelcome';
import { Onboarding } from '@/components/coparenting/Onboarding';
import { Plus, Printer, Archive } from 'lucide-react';
import { Timeline, catColor } from '@/components/coparenting/Timeline';
import { coParentingTabs, coParentingSection, invitedEmailSchema } from '@/lib/coparentingAccess';

// New tables are not in generated types until the draft is accepted.
const db = supabase as any;
const ROLES = ['Mother', 'Father', 'Child', 'Grandparent', 'Relative', 'My lawyer', 'Their lawyer', 'Court officer', 'Police', 'School', 'Other'];
const CHANNELS = ['In person', 'Video call', 'Voice call', 'Text', 'WhatsApp', 'Email', 'Letter', 'Court', 'Police'];
const STATUSES = ['Documented', 'My account', 'To confirm'];
const BANNED = /\b(narcissist|manipulativ\w*|spite\w*|alienat\w*|gaslight\w*)\b/i;
const SCHEDULE_DAYS = [2, 4, 6]; // Tue, Thu, Sat per current order

type Entry = { id: string; user_id: string; event_date: string; date_label: string | null; date_precision: string; phase: string | null; category: string; title: string; details: string | null; initiated_by: string | null; channel: string | null; child_effect: string | null; my_response: string | null; status: string; amount: number | null; history: any[]; created_at: string; is_important?: boolean };
type Call = { id: string; call_date: string; outcome: string; made_by: string | null; duration_min: number | null; child_mood: string | null; notes: string | null };
const blank = (): Partial<Entry> => ({ event_date: format(new Date(), 'yyyy-MM-dd'), category: 'Calls', title: '', details: '', status: 'My account', date_precision: 'exact' });
const money = (n: number) => `TT$${n.toFixed(2)}`;

export default function CoParenting() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = coParentingSection(searchParams.get('section'));
  const goSection = (value: string) => { setSearchParams({ section: value }); window.scrollTo(0, 0); };
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [shared, setShared] = useState<{ owner_id: string }[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Partial<Entry> | null>(null);
  const [privateText, setPrivateText] = useState('');
  const readOnly = !!user && ownerId !== null && ownerId !== user.id;
  const [display, setDisplay] = useState<any>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const me = display?.my_role || 'You'; const other = display?.other_role || 'Other parent';

  useEffect(() => { if (!user) return; void (async () => {
    const [v, prof, own] = await Promise.all([
      db.from('coparenting_viewers').select('owner_id').neq('owner_id', user.id),
      db.from('coparenting_profile').select('onboarded_at').eq('user_id', user.id).maybeSingle(),
      db.from('coparenting_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    const sh = v.data || []; setShared(sh);
    const hasOwn = !!prof.data?.onboarded_at || (own.count || 0) > 0;
    // Someone invited to view (with no record of their own) lands on the shared record.
    if (!hasOwn && sh.length) setOwnerId(sh[0].owner_id); else { setOwnerId(user.id); setNeedsSetup(!hasOwn); }
  })(); }, [user?.id]);
  async function load() {
    if (!ownerId || !user) return;
    setLoading(true); setError('');
    const [e, c, d] = await Promise.all([
      db.from('coparenting_entries').select('*').eq('user_id', ownerId).is('archived_at', null).order('event_date', { ascending: false }),
      ownerId === user.id ? db.from('coparenting_calls').select('*').eq('user_id', ownerId).order('call_date', { ascending: false }) : Promise.resolve({ data: [], error: null }),
      db.from('coparenting_display').select('*').eq('user_id', ownerId).maybeSingle(),
    ]);
    setDisplay(d.data || null);
    if (e.error || c.error) setError('Your log could not load. If this was just set up, it becomes available once the update is accepted.');
    setEntries(e.data || []); setCalls(c.data || []); setLoading(false);
  }
  useEffect(() => { if (section) void load(); }, [ownerId, section]);

  const visible = useMemo(() => entries.filter(e => (!cats.length || cats.includes(e.category)) && (status === 'all' || e.status === status) && (!q || `${e.title} ${e.details || ''}`.toLowerCase().includes(q.toLowerCase()))), [entries, cats, status, q]);

  async function openEntry(e: Partial<Entry>) {
    setEditing(e); setPrivateText('');
    if (e.id && !readOnly) { const { data } = await db.from('coparenting_private').select('details').eq('entry_id', e.id).maybeSingle(); setPrivateText(data?.details || ''); }
  }
  async function saveEntry() {
    if (readOnly) return;
    if (!user || !editing?.title?.trim() || !editing.event_date) { toast.error('Add a date and a short title.'); return; }
    if (BANNED.test(`${editing.title} ${editing.details || ''}`)) { toast('Try describing what was said or done instead of a label. Facts read stronger.'); return; }
    const fields = { event_date: editing.event_date, date_label: editing.date_label || null, date_precision: editing.date_precision || 'exact', phase: editing.phase || null, category: editing.category, title: editing.title.trim(), details: editing.details || null, initiated_by: editing.initiated_by || null, channel: editing.channel || null, child_effect: editing.child_effect || null, my_response: editing.my_response || null, status: editing.status || 'My account', is_important: !!editing.is_important, amount: editing.amount ? Number(editing.amount) : null };
    let id = editing.id;
    if (id) {
      const prev = entries.find(x => x.id === id);
      if (!prev) return;
      const { title, details, event_date, status: st, amount } = prev;
      const r = await db.from('coparenting_entries').update({ ...fields, history: [...(prev.history || []), { changed_at: new Date().toISOString(), previous: { title, details, event_date, status: st, amount } }], updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
      if (r.error) { toast.error('Not saved. Please try again.'); return; }
    } else {
      const r = await db.from('coparenting_entries').insert({ ...fields, user_id: user.id }).select('id').single();
      if (r.error) { toast.error('Not saved. Please try again.'); return; }
      id = r.data.id;
    }
    if (privateText.trim()) await db.from('coparenting_private').upsert({ entry_id: id, user_id: user.id, details: privateText.trim(), updated_at: new Date().toISOString() });
    toast.success('Saved to your log.'); setEditing(null); void load();
  }
  async function toggleImportant(e: { id: string; is_important?: boolean }) {
    if (!user || readOnly) return;
    const r = await db.from('coparenting_entries').update({ is_important: !e.is_important }).eq('id', e.id).eq('user_id', user.id);
    if (r.error) toast.error('Not saved. Please try again.'); else setEntries(p => p.map(x => x.id === e.id ? { ...x, is_important: !e.is_important } : x));
  }
  async function archive(e: Entry) {
    if (!user || readOnly || !confirm('Archive this entry? It stays in your records but leaves the timeline.')) return;
    await db.from('coparenting_entries').update({ archived_at: new Date().toISOString() }).eq('id', e.id).eq('user_id', user.id); setEditing(null); void load();
  }
  if (!user) { localStorage.setItem('intendedPath', '/co-parenting'); return <main className="container mx-auto max-w-3xl px-4 py-8"><CoParentingWelcome signedIn={false} /></main>; }
  if (!section) return <main className="container mx-auto max-w-3xl px-4 py-8"><CoParentingWelcome signedIn readOnly={readOnly} startLabel={readOnly ? 'View shared timeline' : ownerId && !needsSetup ? 'Open my private log' : 'Start my private log'} onStart={() => goSection(readOnly ? 'timeline' : needsSetup ? 'setup' : 'timeline')} onSection={goSection} /></main>;
  if (!ownerId) return <main className="container mx-auto max-w-3xl px-4 py-8"><p role="status">Checking your private access…</p></main>;
  return <main className="container mx-auto max-w-3xl space-y-6 px-4 py-8 print:py-0">
    <header className="space-y-2 print:hidden">
      <Button variant="ghost" onClick={() => { setSearchParams({}); window.scrollTo(0, 0); }}>← Co-parenting home</Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Co-parenting</h1>
        {shared.length > 0 && <Select value={ownerId || ''} onValueChange={setOwnerId}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={user.id}>My record</SelectItem>{shared.map((s, i) => <SelectItem key={s.owner_id} value={s.owner_id}>Shared record {i + 1} (view only)</SelectItem>)}</SelectContent></Select>}
      </div>
      <p className="text-muted-foreground">A private, factual record of access, maintenance and issues for your child. People appear by role only. Prepared from your own records — not legal advice.</p>
      {readOnly && <Badge variant="secondary">Timeline only · Read-only access</Badge>}
    </header>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {needsSetup && !readOnly ? <><div id="cp-onboarding" /><Onboarding userId={user.id} onDone={() => { setNeedsSetup(false); goSection('timeline'); void load(); }} /></> : <>
    <Tabs key={ownerId} value={coParentingTabs(readOnly).includes(section) ? section : 'timeline'} onValueChange={goSection}>
      <TabsList className="flex h-auto flex-wrap print:hidden">
        {coParentingTabs(readOnly).map(tab => <TabsTrigger key={tab} value={tab}>{{ timeline: 'Timeline', access: 'Access & calls', maintenance: 'Maintenance', summary: 'Summary', sharing: 'Sharing' }[tab]}</TabsTrigger>)}
      </TabsList>

      <TabsContent value="timeline" className="space-y-4">
        <div className="flex flex-wrap gap-2 print:hidden">
          {!readOnly && <Button onClick={() => openEntry(blank())}><Plus className="mr-2 h-4 w-4" />Log something</Button>}
          <Input className="max-w-xs" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">{CATEGORIES.map(c => { const on = !cats.length || cats.includes(c); return <button key={c} aria-pressed={on} className={`inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[13px] font-medium transition-opacity ${on ? '' : 'opacity-45'}`} onClick={() => setCats(p => { const cur = p.length ? p : [...CATEGORIES]; const next = cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]; return next.length === CATEGORIES.length ? [] : next; })}><span className="h-2 w-2 rounded-full" style={{ background: catColor(c) }} />{c}</button>; })}</div>
        {loading ? <p role="status">Loading your log…</p> : !entries.length ? <p className="py-8 text-muted-foreground">Nothing here yet — and that's okay. Tap “Log something” to add your first entry.</p> :
          <Timeline entries={visible} phases={display?.phases || []} coverage={display?.coverage} readOnly={readOnly} onOpen={e => openEntry(e as Entry)} onToggleImportant={toggleImportant} />}
      </TabsContent>

      {!readOnly && <>
      <TabsContent value="access"><CallTracker other={other} calls={calls} readOnly={readOnly} userId={user.id} onChange={load} /></TabsContent>
      <TabsContent value="maintenance"><Maintenance entries={entries} other={other} onLog={() => openEntry({ ...blank(), category: 'Money', initiated_by: other, title: 'Maintenance received' })} readOnly={readOnly} /></TabsContent>
      <TabsContent value="summary"><Summary entries={entries} calls={calls} me={me} other={other} /></TabsContent>
      </>}
      {!readOnly && <TabsContent value="sharing"><Sharing userId={user.id} /></TabsContent>}
    </Tabs>
    </>}

    <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing?.id ? (readOnly ? 'Entry' : 'Edit entry') : 'Log something'}</DialogTitle></DialogHeader>
        {editing && <fieldset disabled={readOnly} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Date<Input type="date" value={editing.event_date} onChange={e => setEditing({ ...editing, event_date: e.target.value })} /></label>
            <label className="text-sm">Category<Select value={editing.category} onValueChange={v => setEditing({ ...editing, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></label>
          </div>
          <label className="block text-sm">What happened (one line)<Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
          <label className="block text-sm">Details — facts and exact quotes<Textarea value={editing.details || ''} onChange={e => setEditing({ ...editing, details: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Who started it<Select value={editing.initiated_by || ''} onValueChange={v => setEditing({ ...editing, initiated_by: v })}><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></label>
            <label className="text-sm">Channel<Select value={editing.channel || ''} onValueChange={v => setEditing({ ...editing, channel: v })}><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{CHANNELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></label>
            <label className="text-sm">Status<Select value={editing.status} onValueChange={v => setEditing({ ...editing, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></label>
            <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_important} onChange={e => setEditing({ ...editing, is_important: e.target.checked })} />Important — show the key sentence in bold</label>
            <label className="text-sm">Amount (TT$, optional)<Input type="number" min="0" step="0.01" value={editing.amount ?? ''} onChange={e => setEditing({ ...editing, amount: e.target.value as any })} /></label>
          </div>
          <label className="block text-sm">Effect on the child (what they did or said)<Textarea value={editing.child_effect || ''} onChange={e => setEditing({ ...editing, child_effect: e.target.value })} /></label>
          <label className="block text-sm">My response<Textarea value={editing.my_response || ''} onChange={e => setEditing({ ...editing, my_response: e.target.value })} /></label>
          {!readOnly && <label className="block text-sm">Private details (case numbers, phone, addresses — never shared)<Textarea value={privateText} onChange={e => setPrivateText(e.target.value)} /></label>}
          {editing.id && <p className="text-xs text-muted-foreground">Logged on {format(new Date((editing as Entry).created_at), 'd MMM yyyy, h:mm a')}{(editing as Entry).history?.length ? ` · edited ${(editing as Entry).history.length}×, originals kept` : ''}</p>}
          {!readOnly && <div className="flex justify-between gap-2"><Button onClick={saveEntry}>Save</Button>{editing.id && <Button variant="ghost" onClick={() => archive(editing as Entry)}><Archive className="mr-2 h-4 w-4" />Archive</Button>}</div>}
        </fieldset>}
      </DialogContent>
    </Dialog>
    <div className="pt-4"><CoParentingDisclaimer /></div>
  </main>;
}

function scheduledDays(month: string) {
  const [y, m] = month.split('-').map(Number); const out: string[] = [];
  for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) { const dt = new Date(y, m - 1, d); if (SCHEDULE_DAYS.includes(dt.getDay())) out.push(format(dt, 'yyyy-MM-dd')); }
  return out;
}
function CallTracker({ other, calls, readOnly, userId, onChange }: { other: string; calls: Call[]; readOnly: boolean; userId: string; onChange: () => void }) {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const days = scheduledDays(month); const byDate = new Map(calls.map(c => [c.call_date, c]));
  const logged = days.map(d => byDate.get(d)).filter(Boolean) as Call[];
  const count = (o: string) => logged.filter(c => c.outcome === o).length;
  async function mark(date: string, outcome: string) {
    const r = await db.from('coparenting_calls').upsert({ user_id: userId, call_date: date, outcome, scheduled: true }, { onConflict: 'user_id,call_date' });
    if (r.error) toast.error('Not saved.'); else onChange();
  }
  const OUT: [string, string][] = [['happened', 'Happened'], ['father_missed', `${other} did not call`], ['child_unavailable', 'Child unavailable'], ['mother_missed', 'You missed it']];
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Scheduled call days shown: Tuesday, Thursday and Saturday. Tap what happened after each call.</p>
    <Input type="month" className="w-48" value={month} onChange={e => setMonth(e.target.value)} />
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Scheduled', days.length], ['Happened', count('happened')], [`${other} did not call`, count('father_missed')], ['Child unavailable', count('child_unavailable')], ['You missed', count('mother_missed')]].map(([l, v]) => <div key={l} className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">{l}</dt><dd className="text-xl">{v}</dd></div>)}</dl>
    <ul className="space-y-2">{days.map(d => { const c = byDate.get(d); return <li key={d} className="flex flex-wrap items-center gap-2 rounded-lg border p-2"><span className="w-28 text-sm">{format(new Date(`${d}T12:00:00`), 'EEE d MMM')}</span>{OUT.map(([k, l]) => <Button key={k} size="sm" disabled={readOnly} variant={c?.outcome === k ? 'default' : 'outline'} onClick={() => mark(d, k)}>{l}</Button>)}</li>; })}</ul>
  </div>;
}

function Maintenance({ other, entries, onLog, readOnly }: { other: string; entries: Entry[]; onLog: () => void; readOnly: boolean }) {
  const [weekly, setWeekly] = useState(0); const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const rows = useMemo(() => {
    const out: { month: string; due: number; received: number }[] = [];
    const start = new Date(`${from}T12:00:00`); const now = new Date();
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= now && out.length < 120; d.setMonth(d.getMonth() + 1)) {
      const key = format(d, 'yyyy-MM'); const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const received = entries.filter(e => e.category === 'Money' && e.initiated_by === other && e.amount && e.event_date.startsWith(key)).reduce((s, e) => s + Number(e.amount), 0);
      out.push({ month: key, due: Math.round(weekly * days / 7 * 100) / 100, received });
    }
    return out;
  }, [entries, weekly, from]);
  const owed = rows.reduce((s, r) => s + r.due - r.received, 0);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Order / week (TT$)<Input type="number" value={weekly} onChange={e => setWeekly(Number(e.target.value))} className="w-32" /></label><label className="text-sm">Order started<Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>{!readOnly && <Button onClick={onLog}><Plus className="mr-2 h-4 w-4" />Log a payment received</Button>}</div>
    <p className="text-sm">Difference across these months: <strong>{money(owed)}</strong> {owed > 0 ? '(due but not logged as received)' : ''}. Only payments you log here, with the {other} as payer, count as received.</p>
    <div className="overflow-hidden rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-2">Month</th><th className="p-2 text-right">Due</th><th className="p-2 text-right">Received</th><th className="p-2 text-right">Difference</th></tr></thead><tbody>{rows.map(r => <tr key={r.month} className="border-t"><td className="p-2">{format(new Date(`${r.month}-15T12:00:00`), 'MMM yyyy')}</td><td className="p-2 text-right">{money(r.due)}</td><td className="p-2 text-right">{money(r.received)}</td><td className="p-2 text-right">{money(r.due - r.received)}</td></tr>)}</tbody></table></div>
    <p className="text-sm text-muted-foreground">For what the child actually costs month by month (and half-shares of medical, dental, optical and school costs), use <Link className="underline" to="/reports">Reports → Child expense evidence</Link>.</p>
  </div>;
}

function Summary({ entries, calls, me, other }: { entries: Entry[]; calls: Call[]; me: string; other: string }) {
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1), 'yyyy-MM-dd')); const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd')); const [intro, setIntro] = useState(''); const [meeting, setMeeting] = useState('');
  const list = entries.filter(e => e.event_date >= from && e.event_date <= to).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const inRange = calls.filter(c => c.call_date >= from && c.call_date <= to);
  const paid = list.filter(e => e.category === 'Money' && e.initiated_by === other).reduce((s, e) => s + Number(e.amount || 0), 0);
  return <div className="space-y-4">
    <div className="grid gap-3 print:hidden sm:grid-cols-3"><label className="text-sm">From<Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label className="text-sm">To<Input type="date" value={to} onChange={e => setTo(e.target.value)} /></label><label className="text-sm">Prepared for<Input value={meeting} onChange={e => setMeeting(e.target.value)} /></label></div>
    <Textarea className="print:hidden" placeholder="Short opening paragraph in your words" value={intro} onChange={e => setIntro(e.target.value)} />
    <Button className="print:hidden" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print or save as PDF</Button>
    <article className="space-y-3 rounded-lg border p-6 print:border-0 print:p-0">
      <h2 className="font-heading text-2xl">Summary of events — {format(new Date(`${from}T12:00:00`), 'd MMM yyyy')} to {format(new Date(`${to}T12:00:00`), 'd MMM yyyy')}</h2>
      <p className="text-sm">Prepared for: {meeting}</p>{intro && <p>{intro}</p>}
      <p className="text-sm">Scheduled calls logged: {inRange.length} · happened {inRange.filter(c => c.outcome === 'happened').length} · {other} did not call {inRange.filter(c => c.outcome === 'father_missed').length} · {me} missed {inRange.filter(c => c.outcome === 'mother_missed').length} · Payments logged from {other}: {money(paid)}</p>
      <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-1 pr-2">Date</th><th className="pr-2">Category</th><th className="pr-2">What happened</th><th>Status</th></tr></thead><tbody>{list.map(e => <tr key={e.id} className="border-b align-top"><td className="py-1 pr-2 whitespace-nowrap">{e.date_label || e.event_date}</td><td className="pr-2">{e.category}</td><td className="pr-2">{e.title}</td><td>{e.status}</td></tr>)}</tbody></table>
      <p className="text-sm">Open questions: {list.filter(e => e.status === 'To confirm').length} entries still need a document.</p>
      <p className="border-t pt-2 text-xs text-muted-foreground">Prepared by the {me === 'You' ? 'parent' : me.toLowerCase()} from their own records. People are named by role. Not legal advice.</p>
    </article>
  </div>;
}

function Sharing({ userId }: { userId: string }) {
  const [list, setList] = useState<{ id: string; viewer_email: string }[]>([]); const [email, setEmail] = useState('');
  const load = () => db.from('coparenting_viewers').select('id,viewer_email').eq('owner_id', userId).then(({ data }: any) => setList(data || []));
  useEffect(() => { void load(); }, [userId]);
  async function add() {
    const result = invitedEmailSchema.safeParse(email); if (!result.success) { toast.error('Enter a valid email.'); return; }
    const e = result.data;
    const r = await db.from('coparenting_viewers').insert({ owner_id: userId, viewer_email: e }); if (r.error) toast.error('Could not add.'); else { setEmail(''); load(); }
  }
  const link = 'https://nuacha.com/co-parenting';
  return <div className="max-w-xl space-y-4">
    <p className="text-sm text-muted-foreground">Approve a trusted person to view your timeline only. They enter this exact email on the shared page and sign in. They cannot open Access & calls, Maintenance, Summary or Sharing, see private details, or change anything. No invitation email is sent; send them the link yourself.</p>
    <div className="flex gap-2"><Input type="email" placeholder="their@email.com" value={email} onChange={e => setEmail(e.target.value)} /><Button onClick={add}>Add</Button></div>
    <ul className="space-y-2">{list.map(v => <li key={v.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">{v.viewer_email}<Button size="sm" variant="ghost" onClick={async () => { await db.from('coparenting_viewers').delete().eq('id', v.id).eq('owner_id', userId); load(); }}>Remove</Button></li>)}</ul>
    {list.length > 0 && <div className="flex gap-2"><Input readOnly value={link} /><Button variant="outline" onClick={() => { void navigator.clipboard.writeText(link); toast.success('Link copied.'); }}>Copy link</Button></div>}
  </div>;
}
