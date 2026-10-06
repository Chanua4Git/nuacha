import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Mic, Square, Trash2, Loader2, ChevronRight } from 'lucide-react';
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

type Kind = 'withdrawal' | 'transfer' | 'expense' | 'income';
interface Item {
  kind: Kind; amount: number; date: string;
  from_account_id: string | null; to_account_id: string | null;
  description: string; place: string | null; person: string | null;
}

const KIND_LABEL: Record<Kind, string> = { withdrawal: 'Cash taken out', transfer: 'Moved between accounts', expense: 'Spent', income: 'Money received' };

const FIXED_PROMPTS = [
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
  onSaved: () => void;
}

const VoiceCheckIn = ({ open, onOpenChange, accounts, families, onSaved }: Props) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [free, setFree] = useState('');
  const [mode, setMode] = useState<'guided' | 'free'>('guided');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [note, setNote] = useState('');
  const [familyId, setFamilyId] = useState('');

  useEffect(() => {
    if (!open) return;
    setItems(null); setStep(0); setFree(''); setNote('');
    setFamilyId(families.find((f) => /peltier/i.test(f.name))?.id ?? families[0]?.id ?? '');
    (supabase as any).from('money_routines').select('prompt').eq('is_active', true).not('prompt', 'is', null).order('sort_order')
      .then(({ data }: any) => {
        const list = [...(data ?? []).map((r: any) => r.prompt as string), ...FIXED_PROMPTS];
        setPrompts(list);
        setAnswers(list.map(() => ''));
      });
  }, [open, families]);

  const setAnswer = (i: number, v: string) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)));
  const appendAnswer = (i: number, t: string) => setAnswers((a) => a.map((x, j) => (j === i ? `${x} ${t}`.trim() : x)));

  const understand = async () => {
    const transcript = mode === 'free'
      ? free
      : prompts.map((q, i) => (answers[i]?.trim() ? `Q: ${q}\nA: ${answers[i]}` : '')).filter(Boolean).join('\n\n');
    if (!transcript.trim()) { toast("Nothing to read yet — say or type a little first."); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('money-voice-parse', { body: { transcript, today: format(new Date(), 'yyyy-MM-dd') } });
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
            category: '', date: it.date, place: it.place || it.person || it.description, expense_type: 'actual',
          }).select('id').single();
          if (error) throw error;
          if (exp && it.from_account_id) await setPaidFrom({ expenseId: exp.id }, it.amount, `acct:${it.from_account_id}`);
        } else continue;
        saved++;
      }
      toast.success(saved ? "That's saved. Keep going at your own pace." : 'Nothing needed saving.');
      onSaved();
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

        {!items ? (
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="guided">One question at a time</TabsTrigger>
              <TabsTrigger value="free">Just tell me</TabsTrigger>
            </TabsList>
            <TabsContent value="guided" className="space-y-3 pt-3">
              {prompts.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">Question {step + 1} of {prompts.length} — skip any that don't apply.</p>
                  <p className="font-medium">{prompts[step]}</p>
                  <Textarea rows={3} value={answers[step] ?? ''} onChange={(e) => setAnswer(step, e.target.value)} placeholder="e.g. Took out 6,000 from Grandma's on the 2nd" />
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
              <Textarea rows={6} value={free} onChange={(e) => setFree(e.target.value)} placeholder="e.g. Took out 4,500 from Grandma's for cash wages, moved 3,000 from Grandpa to my account, paid Flow 395…" />
              <MicButton onText={(t) => setFree((f) => `${f} ${t}`.trim())} />
            </TabsContent>
            <DialogFooter className="pt-3">
              <Button onClick={understand} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} See what I understood</Button>
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
                <Input value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" inputMode="decimal" value={it.amount} onChange={(e) => update(i, { amount: Number(e.target.value) })} />
                  <Input type="date" value={it.date} onChange={(e) => update(i, { date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {it.kind !== 'income' && <AccountPick value={it.from_account_id} onChange={(v) => update(i, { from_account_id: v })} placeholder="From which account?" />}
                  {(it.kind === 'transfer' || it.kind === 'income') && <AccountPick value={it.to_account_id} onChange={(v) => update(i, { to_account_id: v })} placeholder="Into which account?" />}
                </div>
              </div>
            ))}
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
              <Button onClick={save} disabled={busy || !items.length}>{busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Save</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCheckIn;
