import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { toast } from 'sonner';

export interface MoneyAccount {
  id: string;
  user_id: string;
  family_id: string | null;
  name: string;
  account_last4: string | null;
  income_source_id: string | null;
  monthly_income: number;
  known_balance: number | null;
  known_balance_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CashWithdrawal {
  id: string;
  account_id: string;
  withdrawn_on: string;
  amount: number;
  balance_after: number | null;
  has_slip: boolean;
  purpose: string | null;
  notes: string | null;
  created_at: string;
}

export interface MoneyAllocation {
  id: string;
  account_id: string;
  withdrawal_id: string | null;
  expense_id: string | null;
  payroll_entry_id: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface LinkedItem {
  label: string;
  date: string | null;
  total: number;
  kind: 'expense' | 'wage';
}

export interface IncomeSourceLite {
  id: string;
  name: string;
  amount_ttd: number;
  frequency: string;
  family_id: string | null;
}

export interface LinkableItem {
  id: string;
  kind: 'expense' | 'wage';
  label: string;
  date: string;
  amount: number;
  familyName?: string;
}

const num = (v: unknown) => Number(v ?? 0);

/** Walks forward from the last known balance; slips with a printed balance reset it exactly. */
export const computeAvailable = (
  account: MoneyAccount,
  withdrawals: CashWithdrawal[],
  incomeIn: { account_id: string | null; delivered_on: string | null; amount: number }[] = [],
) => {
  if (account.known_balance === null || account.known_balance === undefined) return null;
  const start = account.known_balance_date ?? '0000-01-01';
  let balance = num(account.known_balance);
  // Money received (e.g. Garden Ohm orders) after the balance date adds to the pot.
  incomeIn
    .filter((i) => i.account_id === account.id && i.delivered_on && i.delivered_on > start)
    .forEach((i) => { balance += num(i.amount); });
  withdrawals
    .filter((w) => w.account_id === account.id && w.withdrawn_on >= start)
    .sort((a, b) => a.withdrawn_on.localeCompare(b.withdrawn_on) || a.created_at.localeCompare(b.created_at))
    .forEach((w) => {
      balance = w.balance_after !== null && w.balance_after !== undefined ? num(w.balance_after) : balance - num(w.amount);
    });
  return balance;
};

export const useMoneyPots = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<MoneyAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>([]);
  const [allocations, setAllocations] = useState<MoneyAllocation[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceLite[]>([]);
  const [linkedItems, setLinkedItems] = useState<Record<string, LinkedItem>>({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [acc, wd, al, inc] = await Promise.all([
        supabase.from('money_accounts').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('cash_withdrawals').select('*').eq('user_id', user.id).order('withdrawn_on', { ascending: false }),
        supabase.from('money_allocations').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('income_sources').select('id,name,amount_ttd,frequency,family_id').eq('user_id', user.id).eq('is_active', true),
      ]);
      if (acc.error) throw acc.error;
      if (wd.error) throw wd.error;
      if (al.error) throw al.error;
      const allocs = (al.data ?? []) as MoneyAllocation[];
      setAccounts((acc.data ?? []) as MoneyAccount[]);
      setWithdrawals((wd.data ?? []) as CashWithdrawal[]);
      setAllocations(allocs);
      setIncomeSources((inc.data ?? []) as IncomeSourceLite[]);

      const expenseIds = [...new Set(allocs.map((a) => a.expense_id).filter(Boolean))] as string[];
      const wageIds = [...new Set(allocs.map((a) => a.payroll_entry_id).filter(Boolean))] as string[];
      const items: Record<string, LinkedItem> = {};
      if (expenseIds.length) {
        const { data } = await supabase.from('expenses').select('id,description,place,date,amount').in('id', expenseIds);
        (data ?? []).forEach((e: any) => {
          items[e.id] = { label: e.description || e.place, date: e.date, total: num(e.amount), kind: 'expense' };
        });
      }
      if (wageIds.length) {
        const { data } = await supabase
          .from('payroll_entries')
          .select('id,net_pay,week_start_date,pay_day_date,employees(first_name,last_name)')
          .in('id', wageIds);
        (data ?? []).forEach((p: any) => {
          const name = p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : 'Employee';
          items[p.id] = { label: `Wages – ${name}`, date: p.pay_day_date ?? p.week_start_date, total: num(p.net_pay), kind: 'wage' };
        });
      }
      setLinkedItems(items);
    } catch (error) {
      console.error('Could not load money accounts:', error);
      toast.error('We couldn’t load your accounts just now. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAccount = async (values: Partial<MoneyAccount> & { name: string }, id?: string) => {
    if (!user) return;
    const payload = { ...values, user_id: user.id };
    const { error } = id
      ? await supabase.from('money_accounts').update(payload).eq('id', id)
      : await supabase.from('money_accounts').insert(payload);
    if (error) throw error;
    await load();
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from('money_accounts').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  const saveWithdrawal = async (values: Omit<CashWithdrawal, 'id' | 'created_at'>, id?: string) => {
    if (!user) return;
    const payload = { ...values, user_id: user.id };
    const { error } = id
      ? await supabase.from('cash_withdrawals').update(payload).eq('id', id)
      : await supabase.from('cash_withdrawals').insert(payload);
    if (error) throw error;
    await load();
  };

  const deleteWithdrawal = async (id: string) => {
    const { error } = await supabase.from('cash_withdrawals').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  const addAllocation = async (values: Omit<MoneyAllocation, 'id' | 'created_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('money_allocations').insert({ ...values, user_id: user.id });
    if (error) throw error;
    await load();
  };

  const removeAllocation = async (id: string) => {
    const { error } = await supabase.from('money_allocations').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  /** Expenses and wage payments in a date range that aren't fully covered yet. */
  const fetchLinkable = async (start: string, end: string): Promise<LinkableItem[]> => {
    if (!user) return [];
    const { data: fams } = await supabase.from('families').select('id,name').eq('user_id', user.id);
    const famIds = (fams ?? []).map((f) => f.id);
    const famName = Object.fromEntries((fams ?? []).map((f) => [f.id, f.name]));
    const covered: Record<string, number> = {};
    allocations.forEach((a) => {
      const key = a.expense_id ?? a.payroll_entry_id;
      if (key) covered[key] = (covered[key] ?? 0) + num(a.amount);
    });
    const results: LinkableItem[] = [];
    if (famIds.length) {
      const { data } = await supabase
        .from('expenses')
        .select('id,description,place,date,amount,family_id,expense_type')
        .in('family_id', famIds)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });
      (data ?? [])
        .filter((e: any) => (e.expense_type ?? 'actual') === 'actual')
        .forEach((e: any) => {
          const left = num(e.amount) - (covered[e.id] ?? 0);
          if (left > 0.004) results.push({ id: e.id, kind: 'expense', label: e.description || e.place, date: e.date, amount: left, familyName: famName[e.family_id] });
        });
    }
    const { data: wages } = await supabase
      .from('payroll_entries')
      .select('id,net_pay,week_start_date,pay_day_date,employees!inner(first_name,last_name,user_id)')
      .eq('employees.user_id', user.id)
      .gte('week_start_date', start)
      .lte('week_start_date', end)
      .gt('net_pay', 0);
    (wages ?? []).forEach((p: any) => {
      const left = num(p.net_pay) - (covered[p.id] ?? 0);
      if (left > 0.004) {
        results.push({
          id: p.id,
          kind: 'wage',
          label: `Wages – ${p.employees.first_name} ${p.employees.last_name}`,
          date: p.pay_day_date ?? p.week_start_date,
          amount: left,
          familyName: 'Payroll',
        });
      }
    });
    return results.sort((a, b) => b.date.localeCompare(a.date));
  };

  const matchedByWithdrawal = useMemo(() => {
    const map: Record<string, number> = {};
    allocations.forEach((a) => {
      if (a.withdrawal_id) map[a.withdrawal_id] = (map[a.withdrawal_id] ?? 0) + num(a.amount);
    });
    return map;
  }, [allocations]);

  return {
    accounts,
    withdrawals,
    allocations,
    incomeSources,
    linkedItems,
    matchedByWithdrawal,
    isLoading,
    reload: load,
    saveAccount,
    deleteAccount,
    saveWithdrawal,
    deleteWithdrawal,
    addAllocation,
    removeAllocation,
    fetchLinkable,
  };
};
