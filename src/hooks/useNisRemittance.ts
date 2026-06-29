import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';

export interface NisRemittance {
  id?: string;
  paid_on_date: string | null;
  nib_transaction_code: string | null;
  ni184_submitted: boolean;
  ni184_submitted_at: string | null;
  total_nis: number;
}

const empty: NisRemittance = {
  paid_on_date: null,
  nib_transaction_code: null,
  ni184_submitted: false,
  ni184_submitted_at: null,
  total_nis: 0,
};

export function useNisRemittance(
  employeeId: string | undefined,
  periodMonth: string | undefined, // 'YYYY-MM-01'
  totalNis: number,
) {
  const { user } = useAuth();
  const [data, setData] = useState<NisRemittance>(empty);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !employeeId || !periodMonth) return;
    setLoading(true);
    const { data: row } = await supabase
      .from('nis_remittances')
      .select('*')
      .eq('user_id', user.id)
      .eq('employee_id', employeeId)
      .eq('period_month', periodMonth)
      .maybeSingle();
    if (row) {
      setData({
        id: row.id,
        paid_on_date: row.paid_on_date,
        nib_transaction_code: row.nib_transaction_code,
        ni184_submitted: row.ni184_submitted,
        ni184_submitted_at: row.ni184_submitted_at,
        total_nis: Number(row.total_nis || 0),
      });
    } else {
      setData({ ...empty, total_nis: totalNis });
    }
    setLoading(false);
  }, [user, employeeId, periodMonth, totalNis]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (patch: Partial<NisRemittance>) => {
      if (!user || !employeeId || !periodMonth) return;
      const next = { ...data, ...patch };
      setData(next);
      const payload: any = {
        user_id: user.id,
        employee_id: employeeId,
        period_month: periodMonth,
        total_nis: totalNis,
        paid_on_date: next.paid_on_date,
        nib_transaction_code: next.nib_transaction_code,
        ni184_submitted: next.ni184_submitted,
        ni184_submitted_at: next.ni184_submitted
          ? next.ni184_submitted_at || new Date().toISOString()
          : null,
      };
      await supabase
        .from('nis_remittances')
        .upsert(payload, { onConflict: 'user_id,employee_id,period_month' });
    },
    [user, employeeId, periodMonth, totalNis, data],
  );

  return { data, loading, save, refresh };
}
