import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PaidFromSelect, usePaidFromOptions } from '@/components/money/PaidFromSelect';
import { PaidFromValue, setPaidFrom } from '@/lib/paidFrom';
import { findExistingMatch } from '@/lib/statementMatch';
import { convertHeicToJpeg } from '@/utils/receipt/imageProcessing';

type Line = {
  date: string; description: string; place: string; amount: number;
  kind: 'charge' | 'fee' | 'payment' | 'refund'; category_id: string | null;
  existing?: boolean; selected: boolean;
};

const TT = (n: number) => `TT$${n.toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Port_of_Spain' });

async function toDataUrl(file: File): Promise<string> {
  const f = await convertHeicToJpeg(file);
  const img = await createImageBitmap(f);
  const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

export default function StatementUpload({ familyId }: { familyId?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [note, setNote] = useState('');
  const [paidFrom, setPaidFromValue] = useState<PaidFromValue>(null);
  const opts = usePaidFromOptions();

  const pick = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*,.heic,.heif'; input.multiple = true;
    input.onchange = () => { const files = Array.from(input.files ?? []); if (files.length) read(files); };
    input.click();
  };

  const read = async (files: File[]) => {
    if (!familyId) { toast('Choose a family first, then add your statement.'); return; }
    if (files.length > 8) toast('Reading the first 8 screenshots — add the rest after.');
    setOpen(true); setBusy('reading'); setLines([]); setNote('');
    try {
      const images = await Promise.all(files.slice(0, 8).map(toDataUrl));
      const { data, error } = await supabase.functions.invoke('statement-parse', {
        body: { images, family_id: familyId, today: todayStr() },
      });
      if (error || data?.error) throw new Error(data?.error || "I couldn't read that statement just now.");
      const tx = (data.transactions ?? []) as Line[];
      const dates = tx.map((t) => t.date).sort();
      let saved: { id: string; amount: number; date: string }[] = [];
      if (dates.length) {
        const pad = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
        const { data: rows } = await supabase.from('expenses').select('id,amount,date')
          .eq('family_id', familyId).gte('date', pad(dates[0], -4)).lte('date', pad(dates[dates.length - 1], 4));
        saved = (rows ?? []) as any;
      }
      const pool = [...saved];
      setLines(tx.map((t) => {
        const spend = t.kind === 'charge' || t.kind === 'fee';
        const m = spend ? findExistingMatch(t, pool) : undefined;
        if (m) pool.splice(pool.indexOf(m), 1);
        return { ...t, existing: !!m, selected: spend && !m };
      }));
      setNote(data.note ?? '');
      const last4 = data.card_last4 as string | null;
      const acct = last4 && opts?.accounts.find((a) => a.account_last4 === last4);
      if (acct) setPaidFromValue(`acct:${acct.id}`);
    } catch (e: any) {
      toast("Let's try that again", { description: e.message });
      setOpen(false);
    } finally { setBusy(null); }
  };

  const chosen = useMemo(() => lines.filter((l) => l.selected), [lines]);

  const save = async () => {
    if (!familyId || !chosen.length) return;
    setBusy('saving');
    try {
      const { data, error } = await supabase.from('expenses').insert(chosen.map((l) => ({
        family_id: familyId, amount: l.amount, date: l.date, description: l.description,
        place: l.place || 'Not specified', category: l.category_id ?? '', payment_method: 'card',
        tags: ['statement'], expense_type: 'actual',
      }))).select('id,amount');
      if (error) throw error;
      if (paidFrom) for (const row of data ?? []) await setPaidFrom({ expenseId: row.id }, Number(row.amount), paidFrom, opts ?? undefined);
      toast.success(`${data?.length} ${data?.length === 1 ? 'entry' : 'entries'} saved. Nicely done.`);
      setOpen(false);
      window.location.href = `/app?tab=expenses&highlight=${(data ?? []).map((r) => r.id).join(',')}`;
    } catch (e: any) {
      toast("That didn't save yet", { description: e.message });
    } finally { setBusy(null); }
  };

  const toggle = (i: number) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, selected: !l.selected } : l)));

  return (
    <>
      <Button type="button" variant="outline" className="w-full h-auto py-3 flex-col gap-1" onClick={pick}>
        <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Upload a bank or card statement</span>
        <span className="text-xs text-muted-foreground font-normal">Screenshots from your banking app — we skip anything already saved</span>
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check your statement</DialogTitle>
            <DialogDescription>Tick what you'd like to add. Payments to the card are shown but never counted as spending.</DialogDescription>
          </DialogHeader>

          {busy === 'reading' ? (
            <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading your statement…
            </div>
          ) : (
            <div className="space-y-3">
              {note && <p className="text-sm text-muted-foreground">{note}</p>}
              <div className="space-y-1">
                <p className="text-sm font-medium">Paid from</p>
                <PaidFromSelect value={paidFrom} onChange={setPaidFromValue} options={opts} />
              </div>
              <ul className="divide-y rounded-lg border">
                {lines.map((l, i) => {
                  const spend = l.kind === 'charge' || l.kind === 'fee';
                  return (
                    <li key={i} className="flex items-start gap-3 p-3">
                      <Checkbox checked={l.selected} disabled={!spend} onCheckedChange={() => toggle(i)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.place || l.description}</p>
                        <p className="text-xs text-muted-foreground">{l.date} · {l.description}</p>
                        <div className="flex gap-1 mt-1">
                          {l.existing && <Badge variant="secondary">Already saved</Badge>}
                          {l.kind === 'fee' && <Badge variant="outline">Fee</Badge>}
                          {l.kind === 'payment' && <Badge variant="outline">Payment to card</Badge>}
                          {l.kind === 'refund' && <Badge variant="outline">Refund</Badge>}
                        </div>
                      </div>
                      <span className="text-sm tabular-nums">{TT(l.amount)}</span>
                    </li>
                  );
                })}
                {!lines.length && <li className="p-4 text-sm text-muted-foreground">Nothing found on these screenshots.</li>}
              </ul>
              <Button type="button" className="w-full" disabled={!chosen.length || !!busy} onClick={save}>
                {busy === 'saving' ? 'Saving…' : `Save ${chosen.length} new ${chosen.length === 1 ? 'entry' : 'entries'} · ${TT(chosen.reduce((s, l) => s + l.amount, 0))}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
