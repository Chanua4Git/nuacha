import { useEffect, useRef, useState } from 'react';
import { receiptDateString } from '@/utils/receipt/calendarDate';
import { learnFromSavedDate } from '@/utils/receipt/storeDateFormats';
import { format } from 'date-fns';
import { Mic, Square, Trash2, Loader2, ChevronRight, Camera, ImagePlus, X } from 'lucide-react';
import { handleReceiptUpload } from '@/utils/receipt/uploadHandling';
import { processReceiptWithEdgeFunction, saveReceiptDetailsAndLineItems } from '@/utils/receipt/ocrProcessing';
import type { OCRResult } from '@/types/expense';
import { toast } from 'sonner';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setPaidFrom } from '@/lib/paidFrom';
import GuestAuthStep from './GuestAuthStep';
import { saveDraft, clearDraft, draftFiles, type CheckinDraft } from '@/lib/checkinDraft';
import { trackEvent } from '@/lib/analytics';
import { usePersonalPrompts } from '@/hooks/usePersonalPrompts';

type Kind = 'withdrawal' | 'transfer' | 'expense' | 'income';
interface Item {
  kind: Kind; amount: number; date: string;
  from_account_id: string | null; to_account_id: string | null;
  description: string; place: string | null; person: string | null;
  category_id?: string | null;
  receipt_index?: number | null;
}

interface ReceiptPhoto {
  id: string; file?: File;
  preview: string; url: string | null; status: 'queued' | 'waiting' | 'reading' | 'ready' | 'failed';
  vendor: string | null; date: string | null; total: number | null;
  ocr?: OCRResult;
}

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'few_days', label: 'Last 2–3 days' },
  { key: 'week', label: 'This week' },
] as const;

const KIND_LABEL: Record<Kind, string> = { withdrawal: 'Cash taken out', transfer: 'Moved between accounts', expense: 'Spent', income: 'Money received' };

const GENERIC_PROMPTS = [
  'Did you take out any cash this month? How much, and from which account?',
  'Did you pay anyone in cash (help at home, a sitter, a handyman)? Who, and how much?',
  'Did any money come in (salary, family support, side income)? How much?',
  'Anything else you paid or took out?',
];
const OWNER_EMAIL = 'chanuajohnson4@gmail.com';
const OWNER_PROMPTS = [
  'Any nurse fill-ins or cash wages this week? Who, which days, how much?',
  'Did your brother send anything? How much, and into which account?',
  'Any Garden Ohm business costs (like paying someone for a workshop)?',
  'Anything else you paid or took out?',
];

/** Browser speech-to-text; returns null where the browser doesn't support it. */
const useSpeech = (onText: (t: string) => void) => {
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const Rec = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const start = () => {
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = 'en-TT';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).slice(e.resultIndex).map((r: any) => r[0].transcript).join(' ');
      onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };
  const stop = () => { recRef.current?.stop(); setListening(false); };
  return { supported: !!Rec, listening, start, stop };
};

const MicButton = ({ onText }: { onText: (t: string) => void }) => {
  const s = useSpeech(onText);
  if (!s.supported) return null;
  return s.listening
    ? <Button type="button" variant="secondary" onClick={s.stop}><Square className="h-4 w-4 mr-1" /> Stop</Button>
    : <Button type="button" variant="outline" onClick={s.start}><Mic className="h-4 w-4 mr-1" /> Speak</Button>;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accounts: { id: string; name: string }[];
  families: { id: string; name: string }[];
  onSaved: (info?: { expenseIds: string[]; familyId?: string }) => void;
  /** Daily check-in: opens on the free note, with a time period and receipts. */
  daily?: boolean;
  /** Not signed in: keep the note on this device and ask to sign in first. */
  guest?: boolean;
  /** A guest draft to continue after signing in. */
  resume?: CheckinDraft | null;
}

const VoiceCheckIn = ({ open, onOpenChange, accounts, families: familiesProp, onSaved, daily, guest, resume }: Props) => {
  const [created, setCreated] = useState<{ id: string; name: string }[]>([]);
  const families = [...familiesProp, ...created.filter((c) => !familiesProp.some((f) => f.id === c.id))];
  const [newFamName, setNewFamName] = useState('');
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [lineMember, setLineMember] = useState<Record<number, string>>({});
  const [period, setPeriod] = useState<string>('today');
  const [receipts, setReceipts] = useState<ReceiptPhoto[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [free, setFree] = useState('');
  const [mode, setMode] = useState<'guided' | 'free'>('guided');
  const [busy, setBusy] = useState(false);
  const personal = usePersonalPrompts(open && !guest);
  const [items, setItems] = useState<Item[] | null>(null);
  const [note, setNote] = useState('');
  const [familyId, setFamilyId] = useState('');
  const filesRef = useRef<File[]>([]);
  const [needAuth, setNeedAuth] = useState(false);
  const [autoRun, setAutoRun] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems(null); setStep(0); setFree(''); setNote('');
    setPeriod('today'); setReceipts([]); filesRef.current = []; setNeedAuth(false);
    if (daily) setMode('free');
    if (resume && !guest) {
      setFree(resume.free); setPeriod(resume.period || 'today'); setMode('free');
      draftFiles(resume).then((fs) => { addReceipts(fs); setAutoRun(true); });
      clearDraft();
    }
    setFamilyId(families.find((f) => /peltier/i.test(f.name))?.id ?? families[0]?.id ?? '');
    Promise.all([
      supabase.auth.getUser(),
      (supabase as any).from('money_routines').select('prompt').eq('is_active', true).not('prompt', 'is', null).order('sort_order'),
    ]).then(([{ data: u }, { data }]: any) => {
        const own = u?.user?.email?.toLowerCase() === OWNER_EMAIL;
        const list = [...(data ?? []).map((r: any) => r.prompt as string), ...(own ? OWNER_PROMPTS : GENERIC_PROMPTS)];
        setPrompts(list);
        setAnswers(list.map(() => ''));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, familiesProp, daily, resume, guest]);

  useEffect(() => {
    setMembers([]); setLineMember({});
    if (!familyId) return;
    supabase.from('family_members').select('id,name').eq('family_id', familyId).order('name').then(({ data }) => setMembers(data ?? []));
  }, [familyId]);

  const createFamily = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !name.trim()) return;
    const { data, error } = await supabase.from('families').insert({ user_id: user.id, name: name.trim(), color: '#5A7684' }).select('id,name').single();
    if (error || !data) { toast.error("We couldn't create that just now. Please try again."); return; }
    setCreated((c) => [...c, data]); setFamilyId(data.id); setNewFamName('');
    trackEvent('checkin_family_created', { name: data.name });
    toast.success(`${data.name} is ready.`);
  };

  const pickedFamily = () => familyId || families.find((f) => /peltier/i.test(f.name))?.id || families[0]?.id;

  // Read receipts a couple at a time so 10 photos don't all hit the reader at once.
  const queueRef = useRef<{ id: string; file: File }[]>([]);
  const activeRef = useRef(0);
  const MAX_AT_ONCE = 2;

  const pump = () => {
    while (activeRef.current < MAX_AT_ONCE && queueRef.current.length) {
      const job = queueRef.current.shift()!;
      activeRef.current++;
      readOne(job.id, job.file).finally(() => { activeRef.current--; pump(); });
    }
  };

  const readOne = async (id: string, f: File) => {
    const set = (patch: Partial<ReceiptPhoto>) => setReceipts((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    set({ status: 'reading' });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = await handleReceiptUpload(f);
        if (!url) throw new Error('upload');
        const ocr = await processReceiptWithEdgeFunction(url, pickedFamily());
        if (ocr.error) throw new Error(String(ocr.error));
        const total = Number(String(ocr.amount ?? '').replace(/[^0-9.]/g, '')) || null;
        set({ url, status: 'ready', ocr, vendor: ocr.place ?? null, total, date: receiptDateString(ocr.date) });
        return;
      } catch {
        if (attempt === 0) await new Promise((res) => setTimeout(res, 2500));
      }
    }
    set({ status: 'failed' });
  };

  const addReceipts = (files: FileList | File[] | null) => {
    if (!files?.length) return;
    const list = Array.from(files).map((file) => ({ id: crypto.randomUUID(), file }));
    filesRef.current = [...filesRef.current, ...list.map((l) => l.file)];
    setReceipts((r) => [...r, ...list.map(({ id, file }) => ({ id, file, preview: URL.createObjectURL(file), url: null, status: (guest ? 'queued' : 'waiting') as ReceiptPhoto['status'], vendor: null, date: null, total: null }))]);
    if (guest) return;
    queueRef.current.push(...list);
    pump();
  };
  const retryReceipt = (r: ReceiptPhoto) => {
    if (!r.file) return;
    setReceipts((all) => all.map((x) => (x.id === r.id ? { ...x, status: 'waiting' } : x)));
    queueRef.current.push({ id: r.id, file: r.file });
    pump();
  };
  const removeReceipt = (i: number) => {
    const gone = receipts[i];
    if (gone) queueRef.current = queueRef.current.filter((q) => q.id !== gone.id);
    filesRef.current = filesRef.current.filter((_, j) => j !== i);
    setReceipts((r) => r.filter((_, j) => j !== i));
  };
  const reading = receipts.some((r) => r.status === 'reading' || r.status === 'waiting');
  const doneCount = receipts.filter((r) => r.status === 'ready' || r.status === 'failed').length;

  const setAnswer = (i: number, v: string) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)));
  const appendAnswer = (i: number, t: string) => setAnswers((a) => a.map((x, j) => (j === i ? `${x} ${t}`.trim() : x)));

  useEffect(() => {
    if (autoRun && !reading && !guest) { setAutoRun(false); understand(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, reading, guest]);

  const understand = async () => {
    if (guest) {
      if (!free.trim() && !receipts.length) { toast("Nothing to read yet — say or type a little first, or add a receipt."); return; }
      await saveDraft(free, period, filesRef.current);
      trackEvent('checkin_auth_prompt');
      setNeedAuth(true);
      return;
    }
    const transcript = mode === 'free'
      ? free
      : prompts.map((q, i) => (answers[i]?.trim() ? `Q: ${q}\nA: ${answers[i]}` : '')).filter(Boolean).join('\n\n');
    const ready = receipts.map((r, i) => ({ index: i, vendor: r.vendor, date: r.date, total: r.total, ok: r.status === 'ready' })).filter((r) => r.ok);
    if (!transcript.trim() && !ready.length) { toast("Nothing to read yet — say or type a little first, or add a receipt."); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('money-voice-parse', { body: { transcript: transcript.trim() || '(No note — just the receipts.)', today: format(new Date(), 'yyyy-MM-dd'), family_id: familyId || undefined, period: daily ? period : undefined, receipts: ready.map(({ ok, ...r }) => r) } });
    setBusy(false);
    if (error) {
      let msg = "I couldn't read that just now.";
      if (error instanceof FunctionsHttpError) { try { msg = (await error.context.json()).error ?? msg; } catch { /* keep default */ } }
      toast.error(msg);
      return;
    }
    setItems((data?.items ?? []) as Item[]);
    setNote(data?.note ?? '');
  };

  const update = (i: number, patch: Partial<Item>) => setItems((list) => list!.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const save = async () => {
    if (!items?.length) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBusy(true);
    let saved = 0;
    const expenseIds: string[] = [];
    try {
      for (const it of items) {
        if (!it.amount || it.amount <= 0) continue;
        if (it.kind === 'withdrawal' && it.from_account_id) {
          const { error } = await supabase.from('cash_withdrawals').insert({ user_id: user.id, account_id: it.from_account_id, withdrawn_on: it.date, amount: it.amount, purpose: it.description });
          if (error) throw error;
        } else if (it.kind === 'transfer' && it.from_account_id && it.to_account_id) {
          const { error } = await (supabase as any).from('account_transfers').insert({ user_id: user.id, from_account_id: it.from_account_id, to_account_id: it.to_account_id, amount: it.amount, transferred_on: it.date, notes: it.description });
          if (error) throw error;
        } else if (it.kind === 'income' && it.to_account_id) {
          const { error } = await supabase.from('business_income').insert({
            user_id: user.id, source: 'manual', external_order_id: crypto.randomUUID(), order_number: null,
            customer_name: it.description, amount: it.amount, currency: 'TTD', channel: 'bank', channel_locked: true,
            account_id: it.to_account_id, delivered_on: it.date,
          });
          if (error) throw error;
        } else if (it.kind === 'expense' && familyId) {
          const { data: exp, error } = await supabase.from('expenses').insert({
            family_id: familyId, amount: it.amount, description: it.person ? `Wages - ${it.person}` : it.description,
            category: it.category_id || '', date: it.date,
            receipt_url: it.receipt_index != null ? receipts[it.receipt_index]?.url ?? null : null, place: it.place || it.person || it.description, expense_type: 'actual',
          }).select('id').single();
          if (error) throw error;
          if (exp?.id) expenseIds.push(exp.id);
          if (it.receipt_index != null) learnFromSavedDate(it.place, it.date);
          const rOcr = it.receipt_index != null ? receipts[it.receipt_index]?.ocr : undefined;
          if (exp && rOcr) { try { await saveReceiptDetailsAndLineItems(exp.id, rOcr); } catch (e) { console.error('receipt details', e); } }
          const mem = lineMember[items.indexOf(it)];
          if (exp && mem) await supabase.from('expense_members').insert({ expense_id: exp.id, member_id: mem, allocation_percentage: 100 });
          if (exp && it.from_account_id) await setPaidFrom({ expenseId: exp.id }, it.amount, `acct:${it.from_account_id}`);
        } else continue;
        saved++;
      }
      trackEvent('checkin_saved', { lines: saved });
      await (supabase as any).from('profiles').update({ last_checkin_at: new Date().toISOString() }).eq('id', user.id);
      toast.success(saved ? "That's saved. Keep going at your own pace." : 'Nothing needed saving.');
      onSaved({ expenseIds, familyId: familyId || undefined });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(`Saved ${saved}, then something didn't go through. Please check and try the rest again.`);
    } finally {
      setBusy(false);
    }
  };

  const AccountPick = ({ value, onChange, placeholder }: { value: string | null; onChange: (v: string | null) => void; placeholder: string }) => (
    <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
      <SelectTrigger className="h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{placeholder}</SelectItem>
        {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Talk it through</DialogTitle>
          <DialogDescription>Speak or type. I'll show you what I understood — nothing saves until you say so.</DialogDescription>
        </DialogHeader>

        {needAuth ? (
          <GuestAuthStep onBack={() => setNeedAuth(false)} />
        ) : !items ? (
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              {daily ? <>
                <TabsTrigger value="free">Just tell me</TabsTrigger>
                <TabsTrigger value="guided">Monthly questions</TabsTrigger>
              </> : <>
                <TabsTrigger value="guided">One question at a time</TabsTrigger>
                <TabsTrigger value="free">Just tell me</TabsTrigger>
              </>}
            </TabsList>
            <TabsContent value="guided" className="space-y-3 pt-3">
              {prompts.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">Question {step + 1} of {prompts.length} — skip any that don't apply.</p>
                  <p className="font-medium">{prompts[step]}</p>
                  <Textarea rows={3} value={answers[step] ?? ''} onChange={(e) => setAnswer(step, e.target.value)} placeholder={personal?.accountName ? `e.g. Took out 1,000 from ${personal.accountName} on the 2nd` : 'e.g. Took out 1,000 from my savings on the 2nd'} />
                  <div className="flex flex-wrap gap-2">
                    <MicButton onText={(t) => appendAnswer(step, t)} />
                    <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
                    {step < prompts.length - 1
                      ? <Button variant="outline" onClick={() => setStep((s) => s + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                      : null}
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="free" className="space-y-3 pt-3">
              {daily && (
                <div className="flex flex-wrap gap-2">
                  {PERIODS.map((p) => (
                    <Button key={p.key} type="button" size="sm" variant={period === p.key ? 'default' : 'outline'} onClick={() => setPeriod(p.key)}>{p.label}</Button>
                  ))}
                </div>
              )}
              <div className="rounded-xl bg-accent/40 p-3 text-sm space-y-1">
                <p className="font-medium">How to use it</p>
                <p className="text-muted-foreground">Tap <strong>Speak</strong> to start, talk naturally, then tap again to stop when you're finished. Or just type.</p>
                <p className="text-muted-foreground">Try saying: "{'I spent 300 at nuacha.com for a done-for-you setup, paid from my savings account ending 1234.'}"</p>
                {personal?.empty && <p className="text-muted-foreground">Start with one thing you bought today.</p>}
              </div>
              {personal && personal.nudges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {personal.nudges.map((n) => (
                    <Button key={n.label} type="button" size="sm" variant="secondary" className="rounded-full"
                      onClick={() => setFree((f) => (f ? `${f}\n${n.starter}` : n.starter))}>{n.label}</Button>
                  ))}
                </div>
              )}
              <Textarea rows={5} value={free} onChange={(e) => setFree(e.target.value)} placeholder="What did you spend, where, and what was it for?" />
              <div className="flex flex-wrap gap-2">
                <MicButton onText={(t) => setFree((f) => `${f} ${t}`.trim())} />
                {daily && (
                  <>
                    <Button type="button" variant="outline" onClick={() => cameraRef.current?.click()}><Camera className="h-4 w-4 mr-1" /> Snap receipt</Button>
                    <Button type="button" variant="outline" onClick={() => photosRef.current?.click()}><ImagePlus className="h-4 w-4 mr-1" /> Add receipts</Button>
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addReceipts(e.target.files); e.target.value = ''; }} />
                    <input ref={photosRef} type="file" accept="image/*,.heic" multiple className="hidden" onChange={(e) => { addReceipts(e.target.files); e.target.value = ''; }} />
                  </>
                )}
              </div>
              {receipts.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {receipts.map((r, i) => (
                    <div key={i} className="relative rounded-lg border overflow-hidden text-xs">
                      <img src={r.preview} alt={`Receipt ${i + 1}`} className="h-20 w-full object-cover" />
                      <div className="p-1 break-words">
                        {r.status === 'queued' ? <span className="text-muted-foreground">Ready to read</span>
                          : r.status === 'reading' ? <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Reading…</span>
                          : r.status === 'failed' ? <span className="text-muted-foreground">Couldn't read this one</span>
                          : <span>{r.vendor ?? 'Receipt'}{r.total ? ` · ${r.total.toFixed(2)}` : ''}</span>}
                      </div>
                      <button type="button" aria-label="Remove receipt" onClick={() => removeReceipt(i)} className="absolute top-1 right-1 rounded-full bg-background/90 p-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <DialogFooter className="pt-3">
              <Button onClick={understand} disabled={busy || reading}>{busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} See what I understood</Button>
            </DialogFooter>
          </Tabs>
        ) : (
          <div className="space-y-3">
            {note && <p className="text-sm text-muted-foreground">{note}</p>}
            {items.length === 0 && <p className="text-sm">I didn't find anything to log. You can go back and add a little more.</p>}
            {items.map((it, i) => (
              <div key={i} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Select value={it.kind} onValueChange={(v) => update(i, { kind: v as Kind })}>
                    <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(KIND_LABEL) as Kind[]).map((k) => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label="Remove this line" onClick={() => setItems((l) => l!.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-2 items-center">
                  {it.receipt_index != null && receipts[it.receipt_index] && (
                    <img src={receipts[it.receipt_index].preview} alt="Receipt" className="h-10 w-10 rounded object-cover border shrink-0" />
                  )}
                  <Input value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" inputMode="decimal" value={it.amount} onChange={(e) => update(i, { amount: Number(e.target.value) })} />
                  <Input type="date" value={it.date} onChange={(e) => update(i, { date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {it.kind !== 'income' && <AccountPick value={it.from_account_id} onChange={(v) => update(i, { from_account_id: v })} placeholder="From which account?" />}
                  {(it.kind === 'transfer' || it.kind === 'income') && <AccountPick value={it.to_account_id} onChange={(v) => update(i, { to_account_id: v })} placeholder="Into which account?" />}
                </div>
                {it.kind === 'expense' && members.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-xs text-muted-foreground mr-1">For:</span>
                    {members.map((m) => (
                      <button key={m.id} type="button" onClick={() => setLineMember((s) => ({ ...s, [i]: s[i] === m.id ? '' : m.id }))}
                        className={`text-xs rounded-full border px-2 py-0.5 ${lineMember[i] === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>{m.name}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {items.some((x) => x.kind === 'expense') && families.length === 0 && (
              <div className="rounded-lg border bg-accent/30 p-3 grid gap-2">
                <p className="text-sm font-medium">Who is this spending for?</p>
                <p className="text-xs text-muted-foreground">Pick one to start — you can add more households, a business, or people later.</p>
                <div className="flex flex-wrap gap-2">
                  {['My home', 'My small business', 'Just me'].map((n) => (
                    <Button key={n} size="sm" variant="outline" onClick={() => createFamily(n)}>{n}</Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Or name it (e.g. Mum's house)" value={newFamName} onChange={(e) => setNewFamName(e.target.value)} />
                  <Button size="sm" onClick={() => createFamily(newFamName)} disabled={!newFamName.trim()}>Add</Button>
                </div>
              </div>
            )}
            {items.some((x) => x.kind === 'expense') && families.length > 1 && (
              <div className="grid gap-1">
                <span className="text-sm">Expenses go to</span>
                <Select value={familyId} onValueChange={setFamilyId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{families.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setItems(null)}>Back</Button>
              <Button onClick={save} disabled={busy || !items.length || (items.some((x) => x.kind === 'expense') && !familyId)}>{busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Save</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCheckIn;
