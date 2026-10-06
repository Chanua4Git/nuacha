import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AccountTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  transferred_on: string;
  notes: string | null;
}

/** Money moved between the user's own accounts. Never an expense. */
export const useTransfers = () => {
  const [rows, setRows] = useState<AccountTransfer[]>([]);
  const reload = useCallback(async () => {
    const { data } = await (supabase as any).from('account_transfers').select('*').order('transferred_on', { ascending: false });
    setRows((data ?? []) as AccountTransfer[]);
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { rows, reload };
};
