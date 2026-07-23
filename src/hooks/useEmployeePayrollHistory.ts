import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';

export interface HistoryEntry {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  week_number: number | null;
  week_start_date: string | null;
  week_end_date: string | null;
  days_worked: number;
  hours_worked: number;
  regular_days: number | null;
  holiday_days: number | null;
  holiday_multiplier: number | null;
  gross_pay: number;
  nis_employee_contribution: number;
  nis_employer_contribution: number;
  recorded_pay: number;
  net_pay: number;
  variance_amount: number;
  variance_notes: string | null;
  entry_date: string | null;
  paid_on_date: string | null;
  payment_method: 'cash' | 'bank_transfer' | null;
  period_name: string;
  pay_date: string;
  period_start: string;
  period_end: string;
}

export interface MonthGroup {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  entries: HistoryEntry[];
  totals: {
    days: number;
    calculated: number;
    nisEmployee: number;
    nisEmployer: number;
    totalNIS: number;
    recorded: number;
    variance: number;
    weeks: number;
  };
}

export function useEmployeePayrollHistory(employeeId: string | null) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!user || !employeeId) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_entries')
        .select(`
          id, payroll_period_id, employee_id, week_number,
          week_start_date, week_end_date, days_worked, hours_worked,
          regular_days, holiday_days, holiday_multiplier,
          gross_pay, nis_employee_contribution, nis_employer_contribution,
          recorded_pay, net_pay, variance_amount, variance_notes,
          entry_date, paid_on_date,
          payroll_periods!inner(name, pay_date, start_date, end_date, user_id)
        `)
        .eq('employee_id', employeeId)
        .eq('payroll_periods.user_id', user.id)
        .order('week_start_date', { ascending: true, nullsFirst: false });

      if (cancelled) return;
      if (error) {
        console.error('payroll history load error', error);
        setEntries([]);
      } else {
        const mapped: HistoryEntry[] = (data || []).map((row: any) => ({
          id: row.id,
          payroll_period_id: row.payroll_period_id,
          employee_id: row.employee_id,
          week_number: row.week_number,
          week_start_date: row.week_start_date,
          week_end_date: row.week_end_date,
          days_worked: Number(row.days_worked || 0),
          hours_worked: Number(row.hours_worked || 0),
          regular_days: row.regular_days != null ? Number(row.regular_days) : null,
          holiday_days: row.holiday_days != null ? Number(row.holiday_days) : null,
          holiday_multiplier: row.holiday_multiplier != null ? Number(row.holiday_multiplier) : null,
          gross_pay: Number(row.gross_pay || 0),
          nis_employee_contribution: Number(row.nis_employee_contribution || 0),
          nis_employer_contribution: Number(row.nis_employer_contribution || 0),
          recorded_pay: Number(row.recorded_pay || 0),
          net_pay: Number(row.net_pay || 0),
          variance_amount: Number(row.variance_amount || 0),
          variance_notes: row.variance_notes,
          entry_date: row.entry_date ?? null,
          paid_on_date: row.paid_on_date ?? null,
          period_name: row.payroll_periods?.name ?? '',
          pay_date: row.payroll_periods?.pay_date ?? '',
          period_start: row.payroll_periods?.start_date ?? '',
          period_end: row.payroll_periods?.end_date ?? '',
        }));
        setEntries(mapped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, employeeId, refreshKey]);

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();
    for (const e of entries) {
      const ref = e.week_start_date || e.period_start || e.pay_date;
      if (!ref) continue;
      const d = new Date(ref);
      const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          monthKey,
          monthLabel,
          entries: [],
          totals: { days: 0, calculated: 0, nisEmployee: 0, nisEmployer: 0, totalNIS: 0, recorded: 0, variance: 0, weeks: 0 },
        });
      }
      const g = groups.get(monthKey)!;
      g.entries.push(e);
      g.totals.days += e.days_worked;
      g.totals.calculated += e.gross_pay;
      g.totals.nisEmployee += e.nis_employee_contribution;
      g.totals.nisEmployer += e.nis_employer_contribution;
      g.totals.totalNIS += e.nis_employee_contribution + e.nis_employer_contribution;
      g.totals.recorded += e.recorded_pay;
      g.totals.variance += e.variance_amount;
      g.totals.weeks += 1;
    }
    return Array.from(groups.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [entries]);

  return { entries, monthGroups, loading, refresh };
}
