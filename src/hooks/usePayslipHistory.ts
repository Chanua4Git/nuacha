import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';

export interface PayslipRecord {
  id: string;
  user_id: string;
  employee_id: string;
  phone_sent_to: string | null;
  period_start: string | null;
  period_end: string | null;
  entry_ids: string[];
  days_total: number;
  gross_total: number;
  nis_employee_total: number;
  net_total: number;
  payslip_text: string;
  sent_at: string;
  created_at: string;
}

export function usePayslipHistory(employeeId: string | 'all' | null) {
  const { user } = useAuth();
  const [records, setRecords] = useState<PayslipRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      let query = supabase
        .from('payslips')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (employeeId && employeeId !== 'all') {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error('payslip history error', error);
        setRecords([]);
      } else {
        setRecords(
          (data || []).map((r: any) => ({
            ...r,
            entry_ids: r.entry_ids || [],
            days_total: Number(r.days_total || 0),
            gross_total: Number(r.gross_total || 0),
            nis_employee_total: Number(r.nis_employee_total || 0),
            net_total: Number(r.net_total || 0),
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, employeeId, refreshKey]);

  return { records, loading, refresh };
}
