import { supabase } from '@/integrations/supabase/client';

/** Encoded choice: "acct:<accountId>" (paid straight from account) or "wd:<withdrawalId>" (cash pot). */
export type PaidFromValue = string | null;

export interface PaidFromOptions {
  accounts: { id: string; name: string; account_last4: string | null }[];
  withdrawals: { id: string; account_id: string; withdrawn_on: string; amount: number; purpose: string | null }[];
}

export const loadPaidFromOptions = async (): Promise<PaidFromOptions> => {
  const [a, w] = await Promise.all([
    supabase.from('money_accounts').select('id,name,account_last4').eq('is_active', true).order('created_at'),
    supabase.from('cash_withdrawals').select('id,account_id,withdrawn_on,amount,purpose').order('withdrawn_on', { ascending: false }),
  ]);
  return { accounts: (a.data ?? []) as any, withdrawals: (w.data ?? []) as any };
};

type Target = { expenseId?: string; payrollEntryId?: string };

export const getPaidFrom = async (t: Target): Promise<PaidFromValue> => {
  let q = supabase.from('money_allocations').select('account_id,withdrawal_id').limit(1);
  q = t.expenseId ? q.eq('expense_id', t.expenseId) : q.eq('payroll_entry_id', t.payrollEntryId!);
  const { data } = await q;
  const row = data?.[0];
  if (!row) return null;
  return row.withdrawal_id ? `wd:${row.withdrawal_id}` : `acct:${row.account_id}`;
};

/** Replaces any existing source link for the item with the chosen one (or clears it). */
export const setPaidFrom = async (t: Target, amount: number, value: PaidFromValue, opts?: PaidFromOptions) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  let del = supabase.from('money_allocations').delete();
  del = t.expenseId ? del.eq('expense_id', t.expenseId) : del.eq('payroll_entry_id', t.payrollEntryId!);
  const { error: delErr } = await del;
  if (delErr) throw delErr;
  if (!value) return;
  let accountId: string | null = null;
  let withdrawalId: string | null = null;
  if (value.startsWith('wd:')) {
    withdrawalId = value.slice(3);
    accountId = opts?.withdrawals.find((w) => w.id === withdrawalId)?.account_id ?? null;
    if (!accountId) {
      const { data } = await supabase.from('cash_withdrawals').select('account_id').eq('id', withdrawalId).single();
      accountId = data?.account_id ?? null;
    }
  } else {
    accountId = value.slice(5);
  }
  if (!accountId) return;
  const { error } = await supabase.from('money_allocations').insert({
    user_id: user.id,
    account_id: accountId,
    withdrawal_id: withdrawalId,
    expense_id: t.expenseId ?? null,
    payroll_entry_id: t.payrollEntryId ?? null,
    amount,
  });
  if (error) throw error;
};

export const describePaidFrom = (value: PaidFromValue, opts: PaidFromOptions | null) => {
  if (!value || !opts) return null;
  if (value.startsWith('wd:')) {
    const w = opts.withdrawals.find((x) => x.id === value.slice(3));
    if (!w) return 'Cash';
    const acct = opts.accounts.find((a) => a.id === w.account_id);
    return `Cash · ${acct?.name ?? 'account'} (${w.withdrawn_on})`;
  }
  return opts.accounts.find((a) => a.id === value.slice(5))?.name ?? 'Account';
};
