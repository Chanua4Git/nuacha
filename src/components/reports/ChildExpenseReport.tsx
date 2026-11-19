import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useExpense } from '@/context/ExpenseContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import DetailedReceiptView from '@/components/receipt/DetailedReceiptView';
import { buildEvidenceRows, evidenceSummary, monthlyEvidence, EvidenceDecision, EvidenceExpense, EvidenceRow } from '@/utils/childExpenseEvidence';
import { parseReceiptCalendarDate, toCalendarString } from '@/utils/receipt/calendarDate';
import { Download, FileText, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

const buckets = ['Health & dental', 'Education', 'Childcare & activities', 'Clothing & personal care', 'Food', 'Housing & utilities', 'Transport', 'Other'];
const money = (n: number) => `TT$${n.toFixed(2)}`;
type SavedConfig = { memberId?: string; start?: string; end?: string; weeklyOrder?: number; decisions?: Record<string, EvidenceDecision>; context?: string };

export default function ChildExpenseReport({ embedded = false }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const { selectedFamily, categories } = useExpense();
  const { members } = useFamilyMembers(selectedFamily?.id);
  const [memberId, setMemberId] = useState('');
  const [expenses, setExpenses] = useState<EvidenceExpense[]>([]);
  const [decisions, setDecisions] = useState<Record<string, EvidenceDecision>>({});
  const [start, setStart] = useState(`${new Date().getFullYear()}-01-01`);
  const [end, setEnd] = useState(toCalendarString(new Date()));
  const [weeklyOrder, setWeeklyOrder] = useState(0);
  const [context, setContext] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('suggested');
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedError, setSavedError] = useState('');
  const [templateId, setTemplateId] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  const [receiptId, setReceiptId] = useState<string>();
  const familyMembers = members.filter(m => m.familyId === selectedFamily?.id);
  const member = familyMembers.find(m => m.id === memberId);

  useEffect(() => { setMemberId(''); setExpenses([]); setDecisions({}); }, [selectedFamily?.id, user?.id]);
  useEffect(() => {
    const current = members.filter(m => m.familyId === selectedFamily?.id);
    if (!memberId && current.length) setMemberId((current.find(m => m.type === 'child') || current[0]).id);
  }, [members, memberId, selectedFamily?.id]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(''); setExpenses([]);
      if (!user || !selectedFamily) { setLoading(false); return; }
      try {
        // Verify ownership explicitly as well as relying on the existing RLS policies.
        const owner = await supabase.from('families').select('id').eq('id', selectedFamily.id).eq('user_id', user.id).single();
        if (owner.error) throw owner.error;
        const all: EvidenceExpense[] = [];
        for (let offset = 0; ; offset += 500) {
          const result = await supabase.from('expenses').select('id,date,place,description,amount,category,receipt_url,receipt_image_url,receipt_line_items(id,description,total_price,member_id,category_id),expense_members(member_id,allocation_percentage)').eq('family_id', selectedFamily.id).order('id').range(offset, offset + 499);
          if (result.error) throw result.error;
          all.push(...(result.data as EvidenceExpense[]));
          if (result.data.length < 500) break;
        }
        if (active) setExpenses(all);
      } catch { if (active) setError('Your household receipts could not be loaded. Please try again.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [user?.id, selectedFamily?.id, refresh]);

  useEffect(() => {
    let active = true;
    setDecisions({}); setTemplateId(undefined); setSavedError(''); setContext('');
    if (!user || !selectedFamily || !memberId) return;
    setLoadingSaved(true);
    const type = `child-evidence:${selectedFamily.id}:${memberId}`;
    void supabase.from('report_templates').select('id,config').eq('user_id', user.id).eq('type', type).order('updated_at', { ascending: false }).limit(1).then(({ data, error: loadError }) => {
      if (!active) return;
      setLoadingSaved(false);
      if (loadError) { setSavedError('Your saved review could not be loaded. Please reload before saving.'); return; }
      const saved = data?.[0];
      if (!saved) return;
      const config = saved.config as unknown as SavedConfig;
      setTemplateId(saved.id); setDecisions(config.decisions || {}); setContext(config.context || '');
      if (config.start) setStart(config.start);
      if (config.end) setEnd(config.end);
      if (config.weeklyOrder != null) setWeeklyOrder(config.weeklyOrder);
    });
    return () => { active = false; };
  }, [user?.id, selectedFamily?.id, memberId]);

  const rows = useMemo(() => buildEvidenceRows(expenses, memberId, Object.fromEntries(categories.map(c => [c.id, c.name]))), [expenses, memberId, categories]);
  const summary = evidenceSummary(rows, decisions, start, end, weeklyOrder);
  const months = summary.days ? monthlyEvidence(rows, decisions, start, end, weeklyOrder) : [];
  const visible = rows.filter(r => {
    if (r.date < start || r.date > end) return false;
    if (query && !`${r.description} ${r.place}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (view === 'included') return decisions[r.id]?.included;
    if (view === 'suggested') return r.assigned || r.allocatedAmount > 0 || ['Health & dental', 'Education', 'Childcare & activities', 'Clothing & personal care'].includes(r.bucket);
    return true;
  });
  const decision = (r: EvidenceRow): EvidenceDecision => decisions[r.id] || { included: false, amount: r.allocatedAmount || r.amount, bucket: r.bucket, note: '' };
  function change(r: EvidenceRow, patch: Partial<EvidenceDecision>) { setDecisions(prev => ({ ...prev, [r.id]: { ...decision(r), ...patch } })); }
  const invalidShares = rows.some(r => { const d = decisions[r.id]; return d?.included && (!Number.isFinite(d.amount) || d.amount < 0 || d.amount > r.amount); });
  async function save() {
    if (!user || !selectedFamily || !member || invalidShares || savedError) return;
    setSaving(true);
    try {
      const config = { memberId, start, end, weeklyOrder, decisions, context } as unknown as Json;
      const values = { name: `${member.name} — child expense evidence`, type: `child-evidence:${selectedFamily.id}:${memberId}`, config, updated_at: new Date().toISOString() };
      const result = templateId ? await supabase.from('report_templates').update(values).eq('id', templateId).eq('user_id', user.id).select('id').single() : await supabase.from('report_templates').insert({ ...values, user_id: user.id }).select('id').single();
      if (result.error) throw result.error;
      setTemplateId(result.data.id); toast.success('Your reviewed report is saved.');
    } catch { toast.error('Your report was not saved. Please try again.'); }
    finally { setSaving(false); }
  }
  function download() {
    const records: (string | number)[][] = [
      ['Child expense evidence', member?.name || '', selectedFamily?.name || ''], ['Period', start, end],
      ['Reviewed total TTD', summary.total.toFixed(2)], ['Weekly average TTD', summary.weekly.toFixed(2)], ['Monthly average TTD', summary.monthly.toFixed(2)], ['Existing order weekly TTD', weeklyOrder], ['Existing order monthly equivalent TTD', summary.orderMonthly.toFixed(2)],
      ['Context / changes since order', context], ['Month','Reviewed child cost TTD','Order for month TTD','Difference TTD'], ...months.map(m => [m.month, m.total.toFixed(2), m.orderDue.toFixed(2), m.gap.toFixed(2)]), ['Expense evidence only; not a court award or complete financial affidavit'],
      ['Date','Store/provider','Item','Receipt/item total TTD','Child share TTD','Heading','Reason / allocation note','Expense ID','Line ID'],
      ...rows.filter(r => r.date >= start && r.date <= end && decisions[r.id]?.included).map(r => [r.date,r.place,r.description,r.amount,decisions[r.id].amount,decisions[r.id].bucket,decisions[r.id].note,r.expenseId,r.lineId || ''])
    ];
    const csv = records.map(row => row.map(v => { const text = String(v); return `"${(/^[=+@\-]/.test(text) ? "'" : '') + text.replace(/"/g,'""')}"`; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], {type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = `child-expense-evidence-${start}-${end}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  return <section className={embedded ? "space-y-6" : "space-y-6 border-t pt-6"}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-heading">Child expense evidence</h2><Button variant="outline" size="sm" onClick={() => setRefresh(n => n + 1)} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh receipts</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-2 text-sm">Person<Select value={memberId} onValueChange={setMemberId}><SelectTrigger><SelectValue placeholder="Choose a person"/></SelectTrigger><SelectContent>{familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-2 text-sm">From<Input type="date" value={start} onChange={e => setStart(e.target.value)}/></label>
      <label className="space-y-2 text-sm">To<Input type="date" value={end} onChange={e => setEnd(e.target.value)}/></label>
      <label className="space-y-2 text-sm">Existing order / week (TT$)<Input type="number" min="0" step="0.01" value={weeklyOrder} onChange={e => setWeeklyOrder(Math.max(0,Number(e.target.value)))}/></label>
    </div>
    <p className="text-sm text-muted-foreground">Only reviewed shares count. A receipt from a children’s provider does not establish who received treatment. Shared costs need an explained share.</p>
    {error || savedError ? <p role="alert" className="text-destructive">{error || savedError}</p> : null}
    {summary.days === 0 && <p role="alert">Choose a valid date range.</p>}
    <dl className="grid gap-4 border-y py-5 sm:grid-cols-2 lg:grid-cols-4">{[['Reviewed child cost',summary.total],['Weekly average',summary.weekly],['Monthly average',summary.monthly],['Order / month equivalent',summary.orderMonthly]].map(([label,value]) => <div key={String(label)}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-xl font-medium">{money(Number(value))}</dd></div>)}</dl>
    {months.length > 0 && <div className="space-y-2"><h3 className="font-heading text-lg">Month by month</h3><div className="overflow-hidden rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-2">Month</th><th className="p-2 text-right">Reviewed child cost</th><th className="p-2 text-right">Order for month</th><th className="p-2 text-right">Difference</th></tr></thead><tbody>{months.map(m => <tr key={m.month} className="border-t"><td className="p-2">{format(new Date(`${m.month}-15T12:00:00`), 'MMM yyyy')}</td><td className="p-2 text-right">{money(m.total)}</td><td className="p-2 text-right">{money(m.orderDue)}</td><td className={`p-2 text-right ${m.gap > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{m.gap > 0 ? '+' : ''}{money(m.gap)}</td></tr>)}</tbody></table></div><p className="text-xs text-muted-foreground">Order for month = weekly amount × days in month ÷ 7. Months with few receipts understate real costs.</p></div>}
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{buckets.map(bucket => {
      const total = rows.filter(r => r.date >= start && r.date <= end && decisions[r.id]?.included && decisions[r.id]?.bucket === bucket).reduce((sum,r) => sum + (decisions[r.id].amount >= 0 && decisions[r.id].amount <= r.amount ? decisions[r.id].amount : 0),0);
      return total > 0 ? <div key={bucket} className="flex justify-between gap-3 text-sm"><dt>{bucket}</dt><dd className="shrink-0 font-medium">{money(total)}</dd></div> : null;
    })}</dl>
    <div className="flex flex-wrap gap-3"><Input className="w-full sm:max-w-sm" aria-label="Search receipt items" placeholder="Search items or providers" value={query} onChange={e => setQuery(e.target.value)}/><Select value={view} onValueChange={setView}><SelectTrigger className="w-full sm:w-56"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="suggested">Child-related candidates</SelectItem><SelectItem value="all">All household items</SelectItem><SelectItem value="included">Included in report</SelectItem></SelectContent></Select></div>
    <p className="text-sm text-muted-foreground">{expenses.length} receipts · {rows.length} evidence rows · {visible.length} shown. Averages cover every day in the selected period; missing receipts understate costs.</p>
    {loading || loadingSaved ? <p role="status">Loading your receipts and saved review…</p> : <div className="space-y-3">{visible.map(r => {
      const d = decision(r); const date = parseReceiptCalendarDate(r.date);
      return <article key={r.id} className="rounded-lg border p-4 space-y-3">
        <div className="flex items-start gap-3"><Checkbox aria-label={`Include ${r.description}`} checked={d.included} onCheckedChange={v => change(r,{included:v === true})}/><div className="min-w-0 flex-1"><h3 className="break-words font-medium">{r.description}</h3><p className="break-words text-sm text-muted-foreground">{r.place} · {date ? toCalendarString(date) : 'Check date'} · {money(r.amount)}</p><p className="text-sm text-muted-foreground">{r.reason}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Child’s share (TT$)<Input type="number" min="0" max={r.amount} step="0.01" value={d.amount} onChange={e => change(r,{amount:Number(e.target.value)})}/></label><label className="text-sm">Heading<Select value={d.bucket} onValueChange={bucket => change(r,{bucket})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{buckets.map(b => <SelectItem value={b} key={b}>{b}</SelectItem>)}</SelectContent></Select></label></div>
        <Input aria-label={`Allocation note for ${r.description}`} placeholder="Patient, child’s share, or reason for inclusion" value={d.note} onChange={e => change(r,{note:e.target.value})}/>
        <Button variant="ghost" size="sm" onClick={() => setReceiptId(r.expenseId)}><FileText className="mr-2 h-4 w-4"/>View / edit source receipt</Button>
      </article>;
    })}{!visible.length && <p className="py-6 text-muted-foreground">No matching items. Try All household items or a wider date range.</p>}</div>}
    {invalidShares && <p role="alert" className="text-destructive">A child’s share must be between zero and the source amount.</p>}
    <label className="block space-y-2 text-sm">Changes since the order / supporting context<Input value={context} onChange={e => setContext(e.target.value)} placeholder="School costs, treatment needs, changed income, or other circumstances"/></label>
    <div className="flex flex-wrap gap-3"><Button disabled={loading || loadingSaved || saving || !!error || !!savedError || !member || invalidShares || !summary.days} onClick={() => void save()}><Save className="mr-2 h-4 w-4"/>{saving ? 'Saving…' : 'Save reviewed report'}</Button><Button variant="outline" disabled={loading || loadingSaved || !!error || !!savedError || invalidShares || !summary.days} onClick={download}><Download className="mr-2 h-4 w-4"/>Export reviewed CSV</Button></div>
    <details className="border-t pt-4 text-sm space-y-3"><summary className="cursor-pointer font-medium">🇹🇹 Maintenance review — sources and evidence</summary>
      <p className="mt-3">Under Chapter 46:08, section 19 considers the child’s financial needs, resources, disability and education, alongside each parent’s resources and responsibilities. Section 21 addresses changed circumstances when varying periodical payments. The existing order determines which legal route applies; divorce orders may instead fall under Chapter 45:51.</p>
      <p>Keep the existing order, child’s school and medical invoices, receipts, explained household shares, income records, contributions from both parents and evidence of changed circumstances. This report is a receipt schedule, not a complete financial affidavit, legal advice or a prediction of an award. Receipts alone do not establish what the other parent should pay.</p>
      <p>A weekly order × 52 ÷ 12 gives its monthly equivalent. It is not evidence of payments actually received.</p>
      <ul className="list-disc pl-5 space-y-2"><li><a className="text-primary underline" href="https://laws.gov.tt/ttdll-web/revision/download/46119?type=act" target="_blank" rel="noreferrer">Chapter 46:08, sections 19 and 21</a> — official consolidation reviewed 17 November 2026, updated through December 2007; later amendments not verified.</li><li><a className="text-primary underline" href="https://www.ttlawcourts.org/uncategorised/family-court-form" target="_blank" rel="noreferrer">Judiciary financial application and evidence forms</a> — Form 8 / Form 9 depend on the proceedings.</li><li><a className="text-primary underline" href="https://tt.vlex.com/vid/david-v-david-794053433" target="_blank" rel="noreferrer">David v David (2014)</a> and <a className="text-primary underline" href="https://tt.vlex.com/vid/ali-v-manjoo-ali-793681021" target="_blank" rel="noreferrer">Ali v Manjoo-Ali (2010)</a> — historical variation cases, not current tariffs; full judgments and outcomes not independently verified here.</li></ul>
    </details>
    <Sheet open={!!receiptId} onOpenChange={open => { if (!open) { setReceiptId(undefined); setRefresh(n => n + 1); } }}><SheetContent className="w-full sm:max-w-xl overflow-y-auto"><SheetHeader><SheetTitle>Source receipt</SheetTitle></SheetHeader>{receiptId && <DetailedReceiptView expenseId={receiptId} receiptUrl={expenses.find(e => e.id === receiptId)?.receipt_image_url || expenses.find(e => e.id === receiptId)?.receipt_url}/>}</SheetContent></Sheet>
  </section>;
}