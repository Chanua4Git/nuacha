import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import { Wallet, Plus, Link2, Trash2, Pencil, Receipt, Landmark, PiggyBank, ArrowDownCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useExpense } from '@/context/ExpenseContext';
import { useBusinessIncome } from '@/hooks/useBusinessIncome';
import GardenOhmIncomeSection from '@/components/money/GardenOhmIncomeSection';
import {
  useMoneyPots,
  computeAvailable,
  type MoneyAccount,
  type CashWithdrawal,
  type LinkableItem,
} from '@/hooks/useMoneyPots';

const tt = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `TT$${Number(n).toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nice = (d: string | null | undefined) => (d ? format(parseISO(d), 'd MMM yyyy') : '');
const today = () => format(new Date(), 'yyyy-MM-dd');

type LinkTarget = { account: MoneyAccount; withdrawal?: CashWithdrawal; remaining?: number };
type ConfirmState = { title: string; body: string; action: () => Promise<void> } | null;

const MoneyPots = () => {
  const pots = useMoneyPots();
  const { families } = useExpense();
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [accountDialog, setAccountDialog] = useState<{ open: boolean; account?: MoneyAccount }>({ open: false });
  const [withdrawalDialog, setWithdrawalDialog] = useState<{ open: boolean; account?: MoneyAccount; withdrawal?: CashWithdrawal }>({ open: false });
  const [linkTarget, setLinkTarget] = useState<LinkTarget | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const monthStart = `${month}-01`;
  const monthEnd = format(endOfMonth(parseISO(monthStart)), 'yyyy-MM-dd');
  const inMonth = (d: string | null | undefined) => !!d && d >= monthStart && d <= monthEnd;

  const summary = useMemo(() => {
    const expected = pots.accounts.reduce((s, a) => s + Number(a.monthly_income || 0), 0);
    const monthWithdrawals = pots.withdrawals.filter((w) => inMonth(w.withdrawn_on));
    const accountName = (id: string) => pots.accounts.find((a) => a.id === id)?.name?.toLowerCase() ?? '';
    const isBigTicket = (w: (typeof monthWithdrawals)[number]) => {
      const text = `${w.purpose ?? ''} ${w.notes ?? ''} ${accountName(w.account_id)}`.toLowerCase();
      return /repair|backup|big|renovation|plumb/.test(text);
    };
    const bigTicketWithdrawals = monthWithdrawals.filter(isBigTicket);
    const livingWithdrawals = monthWithdrawals.filter((w) => !isBigTicket(w));
    const takenOut = monthWithdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const takenOutLiving = livingWithdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const takenOutBigTicket = bigTicketWithdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const matchedCash = monthWithdrawals.reduce((s, w) => s + Math.min(Number(w.amount), pots.matchedByWithdrawal[w.id] ?? 0), 0);
    const direct = pots.allocations
      .filter((a) => !a.withdrawal_id)
      .filter((a) => inMonth(pots.linkedItems[a.expense_id ?? a.payroll_entry_id ?? '']?.date))
      .reduce((s, a) => s + Number(a.amount), 0);
    return { expected, takenOut, takenOutLiving, takenOutBigTicket, matchedCash, unexplained: takenOut - matchedCash, direct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pots.accounts, pots.withdrawals, pots.allocations, pots.linkedItems, pots.matchedByWithdrawal, month]);

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      await confirm.action();
      toast.success('Done. Everything is up to date.');
    } catch (e) {
      console.error(e);
      toast.error('That didn’t go through. Please try again.');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" /> Cash & accounts
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            See what came in, what you took out, and which expenses and wages that money covered.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="month" className="text-xs text-muted-foreground">Month</Label>
            <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value || month)} className="w-40" />
          </div>
          <Button onClick={() => setAccountDialog({ open: true })}>
            <Plus className="h-4 w-4 mr-1" /> Add account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard icon={<PiggyBank className="h-4 w-4" />} label="Expected in each month" value={tt(summary.expected)} hint="From your account set-up and Budget Builder" />
        <SummaryCard icon={<ArrowDownCircle className="h-4 w-4" />} label="Cash for daily living" value={tt(summary.takenOutLiving)} hint={`Day-to-day cash, ${format(parseISO(monthStart), 'MMMM yyyy')}`} />
        <SummaryCard icon={<ArrowDownCircle className="h-4 w-4" />} label="Big-ticket & repairs" value={tt(summary.takenOutBigTicket)} hint="One-off cash like home repairs" />
        <SummaryCard icon={<Receipt className="h-4 w-4" />} label="Cash matched to spending" value={tt(summary.matchedCash)} hint={summary.direct > 0 ? `+ ${tt(summary.direct)} paid straight from accounts` : 'Expenses and wages linked'} />
        <SummaryCard icon={<Wallet className="h-4 w-4" />} label="Cash still to explain" value={tt(summary.unexplained)} hint={summary.unexplained > 0 ? 'Link a receipt or wage when ready' : 'All accounted for'} highlight={summary.unexplained > 0} />
      </div>

      {pots.isLoading ? (
        <p className="text-muted-foreground">Gathering your accounts…</p>
      ) : pots.accounts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">Nothing here yet — and that’s okay. Add the account money usually comes from, like a pension or savings.</p>
            <Button onClick={() => setAccountDialog({ open: true })}><Plus className="h-4 w-4 mr-1" /> Add your first account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pots.accounts.map((account) => {
            const available = computeAvailable(account, pots.withdrawals, gardenOhm.rows);
            const income = pots.incomeSources.find((i) => i.id === account.income_source_id);
            const familyName = families.find((f) => f.id === account.family_id)?.name;
            const accWithdrawals = pots.withdrawals.filter((w) => w.account_id === account.id && inMonth(w.withdrawn_on));
            const directAllocs = pots.allocations.filter(
              (a) => a.account_id === account.id && !a.withdrawal_id && inMonth(pots.linkedItems[a.expense_id ?? a.payroll_entry_id ?? '']?.date),
            );
            return (
              <Card key={account.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="font-serif text-xl flex flex-wrap items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary shrink-0" />
                        <span className="break-words">{account.name}</span>
                        {account.account_last4 && <Badge variant="secondary">•••• {account.account_last4}</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Number(account.monthly_income) > 0 ? `About ${tt(account.monthly_income)} comes in each month` : 'No regular income set'}
                        {income && ` • Budget Builder: “${income.name}” (${tt(income.amount_ttd)})`}
                        {familyName && ` • ${familyName}`}
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Available now</p>
                      <p className="font-serif text-2xl text-primary">{tt(available)}</p>
                      {account.known_balance_date && (
                        <p className="text-xs text-muted-foreground">Based on last check {nice(account.known_balance_date)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" onClick={() => setWithdrawalDialog({ open: true, account })}>
                      <ArrowDownCircle className="h-4 w-4 mr-1" /> Log withdrawal
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLinkTarget({ account })}>
                      <Link2 className="h-4 w-4 mr-1" /> Paid straight from account
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAccountDialog({ open: true, account })}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit / update balance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {accWithdrawals.length === 0 && directAllocs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No money out of this account in {format(parseISO(monthStart), 'MMMM')} yet.</p>
                  )}
                  {accWithdrawals.map((w) => {
                    const matched = pots.matchedByWithdrawal[w.id] ?? 0;
                    const remaining = Number(w.amount) - matched;
                    const links = pots.allocations.filter((a) => a.withdrawal_id === w.id);
                    return (
                      <div key={w.id} className="rounded-2xl border border-border bg-card p-3 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {tt(w.amount)} cash taken out • {nice(w.withdrawn_on)}
                            </p>
                            <p className="text-xs text-muted-foreground break-words">
                              {[w.purpose, w.has_slip ? 'Slip kept' : 'No slip', w.balance_after !== null ? `Balance after ${tt(w.balance_after)}` : null, w.notes]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" aria-label="Edit withdrawal" onClick={() => setWithdrawalDialog({ open: true, account, withdrawal: w })}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Remove withdrawal"
                              className="text-destructive"
                              onClick={() =>
                                setConfirm({
                                  title: 'Remove this withdrawal?',
                                  body: 'The linked expenses stay saved; they just won’t be tied to this cash any more.',
                                  action: () => pots.deleteWithdrawal(w.id),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={Math.min(100, (matched / Number(w.amount)) * 100)} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {tt(matched)} matched • {remaining > 0.004 ? `${tt(remaining)} still to explain` : remaining < -0.004 ? `${tt(-remaining)} more than taken out` : 'fully matched'}
                        </p>
                        <LinkList links={links} linkedItems={pots.linkedItems} onRemove={(id) => setConfirm({ title: 'Unlink this item?', body: 'The expense stays saved.', action: () => pots.removeAllocation(id) })} />
                        {remaining > 0.004 && (
                          <Button size="sm" variant="outline" onClick={() => setLinkTarget({ account, withdrawal: w, remaining })}>
                            <Link2 className="h-4 w-4 mr-1" /> Link an expense or wage
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {directAllocs.length > 0 && (
                    <div className="rounded-2xl border border-dashed border-border p-3 space-y-2">
                      <p className="text-sm font-medium text-foreground">Paid straight from this account (transfers, cards)</p>
                      <LinkList links={directAllocs} linkedItems={pots.linkedItems} onRemove={(id) => setConfirm({ title: 'Unlink this item?', body: 'The expense stays saved.', action: () => pots.removeAllocation(id) })} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Monthly income here matches the incomes in your <Link to="/budget" className="underline">Budget Builder</Link>. Wages come from your{' '}
        <Link to="/payroll" className="underline">Payroll</Link> log and Quick Pay.
      </p>

      <AccountDialog
        open={accountDialog.open}
        account={accountDialog.account}
        families={families}
        incomeSources={pots.incomeSources}
        onClose={() => setAccountDialog({ open: false })}
        onSave={async (values, id) => {
          await pots.saveAccount(values, id);
          toast.success('That’s saved.');
          setAccountDialog({ open: false });
        }}
        onDelete={(id) =>
          setConfirm({
            title: 'Remove this account?',
            body: 'Its withdrawals and links are removed too. Your expenses stay saved.',
            action: async () => {
              await pots.deleteAccount(id);
              setAccountDialog({ open: false });
            },
          })
        }
      />

      <WithdrawalDialog
        open={withdrawalDialog.open}
        account={withdrawalDialog.account}
        withdrawal={withdrawalDialog.withdrawal}
        onClose={() => setWithdrawalDialog({ open: false })}
        onSave={async (values, id) => {
          await pots.saveWithdrawal(values, id);
          toast.success('Withdrawal saved. Link what it paid for when you’re ready.');
          setWithdrawalDialog({ open: false });
        }}
      />

      <LinkDialog
        target={linkTarget}
        monthStart={monthStart}
        monthEnd={monthEnd}
        fetchLinkable={pots.fetchLinkable}
        onClose={() => setLinkTarget(null)}
        onLink={async (item, amount) => {
          if (!linkTarget) return;
          await pots.addAllocation({
            account_id: linkTarget.account.id,
            withdrawal_id: linkTarget.withdrawal?.id ?? null,
            expense_id: item.kind === 'expense' ? item.id : null,
            payroll_entry_id: item.kind === 'wage' ? item.id : null,
            amount,
            notes: null,
          });
          toast.success('Linked. That money is now accounted for.');
        }}
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SummaryCard = ({ icon, label, value, hint, highlight }: { icon: React.ReactNode; label: string; value: string; hint: string; highlight?: boolean }) => (
  <Card className={highlight ? 'border-primary/40 bg-accent/40' : ''}>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground flex items-center gap-1">{icon} {label}</p>
      <p className="font-serif text-xl sm:text-2xl text-foreground mt-1 break-words">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </CardContent>
  </Card>
);

const LinkList = ({
  links,
  linkedItems,
  onRemove,
}: {
  links: { id: string; amount: number; expense_id: string | null; payroll_entry_id: string | null; notes: string | null }[];
  linkedItems: ReturnType<typeof useMoneyPots>['linkedItems'];
  onRemove: (id: string) => void;
}) => {
  if (!links.length) return null;
  return (
    <ul className="space-y-1">
      {links.map((a) => {
        const item = linkedItems[a.expense_id ?? a.payroll_entry_id ?? ''];
        const partial = item && Number(a.amount) < item.total - 0.004;
        return (
          <li key={a.id} className="flex items-start justify-between gap-2 text-sm">
            <span className="min-w-0 break-words text-foreground">
              <Badge variant="outline" className="mr-1 text-[10px]">{item?.kind === 'wage' ? 'Wage' : 'Expense'}</Badge>
              {item?.label ?? 'Removed item'}
              {item?.date && <span className="text-muted-foreground"> • {nice(item.date)}</span>}
              {partial && <span className="text-muted-foreground"> • part of {tt(item.total)}</span>}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="font-medium">{tt(a.amount)}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Unlink" onClick={() => onRemove(a.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const AccountDialog = ({
  open,
  account,
  families,
  incomeSources,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  account?: MoneyAccount;
  families: { id: string; name: string }[];
  incomeSources: { id: string; name: string; amount_ttd: number }[];
  onClose: () => void;
  onSave: (values: Partial<MoneyAccount> & { name: string }, id?: string) => Promise<void>;
  onDelete: (id: string) => void;
}) => {
  const [form, setForm] = useState({ name: '', last4: '', income: '', incomeSource: 'none', family: 'none', balance: '', balanceDate: today(), notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: account?.name ?? '',
      last4: account?.account_last4 ?? '',
      income: account ? String(account.monthly_income ?? '') : '',
      incomeSource: account?.income_source_id ?? 'none',
      family: account?.family_id ?? 'none',
      balance: account?.known_balance !== null && account?.known_balance !== undefined ? String(account.known_balance) : '',
      balanceDate: account?.known_balance_date ?? today(),
      notes: account?.notes ?? '',
    });
  }, [open, account]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Let’s give this account a name first.');
    setSaving(true);
    try {
      await onSave(
        {
          name: form.name.trim(),
          account_last4: form.last4.trim() || null,
          monthly_income: Number(form.income) || 0,
          income_source_id: form.incomeSource === 'none' ? null : form.incomeSource,
          family_id: form.family === 'none' ? null : form.family,
          known_balance: form.balance === '' ? null : Number(form.balance),
          known_balance_date: form.balance === '' ? null : form.balanceDate,
          notes: form.notes.trim() || null,
        },
        account?.id,
      );
    } catch (e) {
      console.error(e);
      toast.error('That didn’t save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{account ? 'Edit account' : 'Add an account'}</DialogTitle>
          <DialogDescription>Only the last 4 digits are kept — never the full account number.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grandma's pension" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last 4 digits"><Input inputMode="numeric" maxLength={4} value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="Comes in monthly (TT$)"><Input type="number" inputMode="decimal" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} /></Field>
          </div>
          <Field label="Matching Budget Builder income">
            <Select
              value={form.incomeSource}
              onValueChange={(v) => {
                const src = incomeSources.find((i) => i.id === v);
                setForm({ ...form, incomeSource: v, income: src && !form.income ? String(src.amount_ttd) : form.income });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not linked</SelectItem>
                {incomeSources.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name} ({tt(i.amount_ttd)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Household">
            <Select value={form.family} onValueChange={(v) => setForm({ ...form, family: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any household</SelectItem>
                {families.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Balance you last saw (TT$)"><Input type="number" inputMode="decimal" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></Field>
            <Field label="Checked on"><Input type="date" value={form.balanceDate} onChange={(e) => setForm({ ...form, balanceDate: e.target.value })} /></Field>
          </div>
          <Field label="Notes (optional)"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {account ? (
            <Button variant="ghost" className="text-destructive" onClick={() => onDelete(account.id)}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WithdrawalDialog = ({
  open,
  account,
  withdrawal,
  onClose,
  onSave,
}: {
  open: boolean;
  account?: MoneyAccount;
  withdrawal?: CashWithdrawal;
  onClose: () => void;
  onSave: (values: Omit<CashWithdrawal, 'id' | 'created_at'>, id?: string) => Promise<void>;
}) => {
  const [form, setForm] = useState({ date: today(), amount: '', balanceAfter: '', slip: false, purpose: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      date: withdrawal?.withdrawn_on ?? today(),
      amount: withdrawal ? String(withdrawal.amount) : '',
      balanceAfter: withdrawal?.balance_after !== null && withdrawal?.balance_after !== undefined ? String(withdrawal.balance_after) : '',
      slip: withdrawal?.has_slip ?? false,
      purpose: withdrawal?.purpose ?? '',
      notes: withdrawal?.notes ?? '',
    });
  }, [open, withdrawal]);

  const submit = async () => {
    if (!account) return;
    if (!(Number(form.amount) > 0)) return toast.error('Let’s add how much was taken out.');
    setSaving(true);
    try {
      await onSave(
        {
          account_id: account.id,
          withdrawn_on: form.date,
          amount: Number(form.amount),
          balance_after: form.balanceAfter === '' ? null : Number(form.balanceAfter),
          has_slip: form.slip,
          purpose: form.purpose.trim() || null,
          notes: form.notes.trim() || null,
        },
        withdrawal?.id,
      );
    } catch (e) {
      console.error(e);
      toast.error('That didn’t save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{withdrawal ? 'Edit withdrawal' : 'Log a withdrawal'}</DialogTitle>
          <DialogDescription>{account?.name}{account?.account_last4 ? ` •••• ${account.account_last4}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Amount (TT$)"><Input type="number" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          </div>
          <Field label="Balance left after (from the slip, optional)"><Input type="number" inputMode="decimal" value={form.balanceAfter} onChange={(e) => setForm({ ...form, balanceAfter: e.target.value })} /></Field>
          <Field label="What it’s for (optional)"><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Home repairs, nurses" /></Field>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="slip">I kept the ATM slip</Label>
            <Switch id="slip" checked={form.slip} onCheckedChange={(v) => setForm({ ...form, slip: v })} />
          </div>
          <Field label="Notes (optional)"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LinkDialog = ({
  target,
  monthStart,
  monthEnd,
  fetchLinkable,
  onClose,
  onLink,
}: {
  target: LinkTarget | null;
  monthStart: string;
  monthEnd: string;
  fetchLinkable: (start: string, end: string) => Promise<LinkableItem[]>;
  onClose: () => void;
  onLink: (item: LinkableItem, amount: number) => Promise<void>;
}) => {
  const [items, setItems] = useState<LinkableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | undefined>(undefined);

  const refresh = async () => {
    setLoading(true);
    try {
      setItems(await fetchLinkable(monthStart, monthEnd));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!target) return;
    setSearch('');
    setAmounts({});
    setRemaining(target.remaining);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, monthStart, monthEnd]);

  const suggested = (item: LinkableItem) =>
    remaining !== undefined ? Math.min(item.amount, Math.max(0, remaining)) : item.amount;

  const filtered = items.filter((i) => `${i.label} ${i.familyName ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  const link = async (item: LinkableItem) => {
    const amount = Number(amounts[item.id] ?? suggested(item).toFixed(2));
    if (!(amount > 0)) return toast.error('Let’s add an amount above zero.');
    setBusy(item.id);
    try {
      await onLink(item, amount);
      if (remaining !== undefined) setRemaining(remaining - amount);
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error('That link didn’t save. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {target?.withdrawal ? `What did the ${tt(target.withdrawal.amount)} cover?` : `Paid from ${target?.account.name}`}
          </DialogTitle>
          <DialogDescription>
            {remaining !== undefined ? `${tt(Math.max(0, remaining))} still to explain. ` : ''}
            Showing expenses and wages from {format(parseISO(monthStart), 'MMMM yyyy')} that aren’t fully covered yet.
          </DialogDescription>
        </DialogHeader>
        <Input placeholder="Search expenses or names" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Looking…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing left to link this month. You’re all caught up.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground break-words">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {nice(item.date)}{item.familyName ? ` • ${item.familyName}` : ''} • {tt(item.amount)} not yet covered
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">{item.kind === 'wage' ? 'Wage' : 'Expense'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    className="h-9"
                    value={amounts[item.id] ?? suggested(item).toFixed(2)}
                    onChange={(e) => setAmounts({ ...amounts, [item.id]: e.target.value })}
                  />
                  <Button size="sm" onClick={() => link(item)} disabled={busy === item.id}>
                    <Link2 className="h-4 w-4 mr-1" /> {busy === item.id ? 'Linking…' : 'Link'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

export default MoneyPots;
