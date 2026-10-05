import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { toast } from 'sonner';

export type IncomeChannel = 'cash' | 'bank' | 'unknown';

export interface BusinessIncomeRow {
  id: string;
  external_order_id: string;
  order_number: string | null;
  customer_name: string | null;
  amount: number;
  payment_method_raw: string | null;
  channel: IncomeChannel;
  account_id: string | null;
  delivered_on: string | null;
}

/** Garden Ohm delivered orders synced in as money received (never counted as spending). */
export const useBusinessIncome = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BusinessIncomeRow[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const all: BusinessIncomeRow[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await (supabase as any)
        .from('business_income')
        .select('id, external_order_id, order_number, customer_name, amount, payment_method_raw, channel, account_id, delivered_on')
        .eq('user_id', user.id)
        .order('delivered_on', { ascending: false })
        .range(from, from + 999);
      if (error) { console.error(error); break; }
      all.push(...(data ?? []).map((r: any) => ({ ...r, amount: Number(r.amount) })));
      if (!data || data.length < 1000) break;
    }
    setRows(all);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const setChannel = useCallback(async (id: string, channel: IncomeChannel, accountId: string | null) => {
    const { error } = await (supabase as any)
      .from('business_income')
      .update({ channel, account_id: accountId, channel_locked: true })
      .eq('id', id);
    if (error) { toast.error("That didn't save — let's try again in a moment."); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, channel, account_id: accountId } : r)));
    toast.success('Saved.');
  }, []);

  return { rows, reload: load, setChannel };
};
