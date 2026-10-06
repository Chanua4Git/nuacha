import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, differenceInCalendarWeeks, endOfMonth } from 'date-fns';
import { Mic, CalendarHeart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { computeAvailable, type MoneyAccount, type CashWithdrawal, type LinkedItem } from '@/hooks/useMoneyPots';
import type { AccountTransfer } from '@/hooks/useTransfers';
import VoiceCheckIn from './VoiceCheckIn';

const tt = (n: number) => `TT$${n.toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  month: string;
  monthStart: string;
  monthEnd: string;
  accounts: MoneyAccount[];
  withdrawals: CashWithdrawal[];
  allocations: { account_id: string; withdrawal_id: string | null; expense_id: string | null; payroll_entry_id: string | null; amount: number }[];
  linkedItems: Record<string, LinkedItem>;
  incomeRows: { account_id: string | null; delivered_on: string | null; amount: number; source?: string }[];
  transfers: AccountTransfer[];
  families: { id: string; name: string }[];
  onSaved: () => void;
}

const WEEKLY_SPENDING = 500;

/** One calm view of the month: came in, went out by pot, what's left, what to tidy. */
const MonthlyCheckIn = (p: Props) => {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [cashPlan, setCashPlan] = useState<{ name: string; amount: number }[]>([]);
  const [untidy, setUntidy] = useState(0);

  const inMonth = (d?: string | null) => !!d && d >= p.monthStart && d <= p.monthEnd;
  const name = (id: string | null) => p.accounts.find((a) => a.id === id)?.name ?? 'Unassigned';

  // Suggested start-of-month cash from the household's known routines (see roadmap / user rules).
  const weeks = differenceInCalendarWeeks(endOfMonth(parseISO(p.monthStart)), parseISO(p.monthStart)) + 1;
  const otherWeeks = Math.ceil(weeks / 2);
  useEffect(() => {
    setCashPlan([
      { name: `Leslie-Ann Dolly Jackman — night nurse (5 nights × TT$250 × ${weeks} weeks)`, amount: 5 * 250 * weeks },
      { name: `Tricia Crawford — fill-in (1 night × TT$250 weekly + 1 day × TT$280 every other week)`, amount: 250 * weeks + 280 * otherWeeks },
      { name: 'Nikki Doe — weekend nurse (2 weekends × TT$600, TT$30/hr × 10 hrs × 2 days)', amount: 2 * 600 },
      { name: 'Basdeo Wackerman — out & in (TT$1,200) + in only (TT$300)', amount: 1500 },
      { name: 'Schawn Millington — groundsman (4 days × TT$300)', amount: 4 * 300 },
      { name: `Spending money (${weeks} weeks × TT$${WEEKLY_SPENDING})`, amount: weeks * WEEKLY_SPENDING },
    ]);
  }, [weeks, otherWeeks]);
  const notCash = [
    { name: 'A N-Collymore (Angela) — paid straight from Grandpa’s pension', amount: null as number | null },
    { name: 'Carlene Williams Kimloaz — 2 weekends × TT$700 (TT$35/hr × 10 hrs × 2 days), paid from Chan’s account', amount: 1400 },
    { name: `Groceries — TT$800–1,000 a week on debit (${weeks} weeks)`, amount: null },
  ];

  // Expenses this month with no "Paid from" yet.
  useEffect(() => {
    (async () => {
      const famIds = p.families.map((f) => f.id);
      if (!famIds.length) return;
      const { data: exps } = await supabase.from('expenses').select('id').in('family_id', famIds).gte('date', p.monthStart).lte('date', p.monthEnd);
      const linked = new Set(p.allocations.map((a) => a.expense_id));
      setUntidy((exps ?? []).filter((e: any) => !linked.has(e.id)).length);
    })();
  }, [p.monthStart, p.monthEnd, p.families, p.allocations]);

  const view = useMemo(() => {
    const cameIn: { label: string; amount: number }[] = [];
    p.accounts.filter((a) => Number(a.monthly_income) > 0).forEach((a) => cameIn.push({ label: `${a.name} (expected)`, amount: Number(a.monthly_income) }));
    const go = p.incomeRows.filter((r) => inMonth(r.delivered_on) && (!r.source || r.source === 'garden_ohm')).reduce((s, r) => s + Number(r.amount), 0);
    if (go) cameIn.push({ label: 'Garden Ohm orders', amount: go });
    p.incomeRows.filter((r) => inMonth(r.delivered_on) && r.source === 'manual')
      .forEach((r) => cameIn.push({ label: `Received into ${name(r.account_id)}`, amount: Number(r.amount) }));

    const out = new Map<string, { cash: number; direct: number; transfersOut: number; transfersIn: number }>();
    const bucket = (id: string) => { if (!out.has(id)) out.set(id, { cash: 0, direct: 0, transfersOut: 0, transfersIn: 0 }); return out.get(id)!; };
    p.withdrawals.filter((w) => inMonth(w.withdrawn_on)).forEach((w) => { bucket(w.account_id).cash += Number(w.amount); });
    p.allocations.filter((a) => !a.withdrawal_id && inMonth(p.linkedItems[a.expense_id ?? a.payroll_entry_id ?? '']?.date))
      .forEach((a) => { bucket(a.account_id).direct += Number(a.amount); });
    p.transfers.filter((t) => inMonth(t.transferred_on)).forEach((t) => {
      bucket(t.from_account_id).transfersOut += Number(t.amount);
      bucket(t.to_account_id).transfersIn += Number(t.amount);
    });
    return { cameIn, out: [...out.entries()] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  const emergencyIds = new Set(p.accounts.filter((a: any) => a.purpose === 'emergency').map((a) => a.id));
  const cashTotal = cashPlan.reduce((s, x) => s + x.amount, 0);

  useEffect(() => { if (window.location.hash === '#check-in') setVoiceOpen(true); }, []);

  return (
    <Card id="check-in">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <CalendarHeart className="h-5 w-5 text-primary" /> {format(parseISO(p.monthStart), 'MMMM')} check-in
          </CardTitle>
          <p className="text-sm text-muted-foreground">What came in, what went out and from where, and what's left.</p>
        </div>
        <Button onClick={() => setVoiceOpen(true)}><Mic className="h-4 w-4 mr-1" /> Talk it through</Button>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <section className="space-y-1">
          <h3 className="text-sm font-medium">Came in</h3>
          {view.cameIn.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet this month.</p>}
          {view.cameIn.map((c, i) => (
            <div key={i} className="flex justify-between gap-2 text-sm"><span className="break-words">{c.label}</span><span>{tt(c.amount)}</span></div>
          ))}
        </section>

        <section className="space-y-1">
          <h3 className="text-sm font-medium">Start-of-month cash (suggested)</h3>
          {cashPlan.map((c) => (
            <div key={c.name} className="flex justify-between gap-2 text-sm"><span className="break-words">{c.name}</span><span>{tt(c.amount)}</span></div>
          ))}
          <div className="flex justify-between text-sm font-medium border-t pt-1"><span>About</span><span>{tt(cashTotal)}</span></div>
          <p className="text-xs text-muted-foreground">Based on your usual routine for a {weeks}-week month. Adjust as you need.</p>
          <h4 className="text-xs font-medium text-muted-foreground pt-2">Not taken out as cash</h4>
          {notCash.map((c) => (
            <div key={c.name} className="flex justify-between gap-2 text-xs text-muted-foreground">
              <span className="break-words">{c.name}</span>
              <span>{c.amount ? tt(c.amount) : c.name.startsWith('Groceries') ? `${tt(800 * weeks)}–${tt(1000 * weeks)}` : ''}</span>
            </div>
          ))}
        </section>

        <section className="space-y-2 md:col-span-2">
          <h3 className="text-sm font-medium">Went out, and what's left</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {p.accounts.map((a) => {
              const o = view.out.find(([id]) => id === a.id)?.[1];
              const left = computeAvailable(a, p.withdrawals, p.incomeRows, p.transfers);
              if (!o && left === null) return null;
              return (
                <div key={a.id} className="rounded-xl border p-3 text-sm space-y-0.5">
                  <div className="font-medium break-words">{a.name}{emergencyIds.has(a.id) && <span className="ml-2 text-xs text-muted-foreground">emergencies only</span>}</div>
                  {o?.cash ? <div className="flex justify-between"><span>Cash taken out</span><span>{tt(o.cash)}</span></div> : null}
                  {o?.direct ? <div className="flex justify-between"><span>Paid straight from it</span><span>{tt(o.direct)}</span></div> : null}
                  {o?.transfersOut ? <div className="flex justify-between"><span>Moved out</span><span>{tt(o.transfersOut)}</span></div> : null}
                  {o?.transfersIn ? <div className="flex justify-between"><span>Moved in</span><span>{tt(o.transfersIn)}</span></div> : null}
                  {left !== null && <div className="flex justify-between text-muted-foreground"><span>Left now</span><span>{tt(left)}</span></div>}
                  {emergencyIds.has(a.id) && o && (o.cash || o.direct || o.transfersOut) ? (
                    <p className="text-xs text-muted-foreground">A one-off this month — that's what it's there for.</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="md:col-span-2 rounded-xl bg-accent/40 p-3 text-sm">
          <h3 className="font-medium mb-1">To tidy, when you're ready</h3>
          {untidy > 0 ? <p>{untidy} expense{untidy === 1 ? '' : 's'} this month without a "Paid from" yet.</p> : <p>Everything this month has a "Paid from". Lovely.</p>}
        </section>
      </CardContent>

      <VoiceCheckIn open={voiceOpen} onOpenChange={setVoiceOpen} accounts={p.accounts} families={p.families} onSaved={p.onSaved} />
    </Card>
  );
};

export default MonthlyCheckIn;
