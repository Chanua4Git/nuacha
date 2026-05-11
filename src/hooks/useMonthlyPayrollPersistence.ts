import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { format } from 'date-fns';

/**
 * Per-week payroll persistence keyed on a monthly payroll_periods row.
 * Each (period, employee, week_number) is a single payroll_entries row,
 * upserted independently so weeks can be saved/cleared without affecting siblings.
 */

export interface WeekSnapshot {
  daysWorked: number;
  recordedPay: number;
  calculatedPay: number;
  nisEmployee: number;
  nisEmployer: number;
  netPay: number;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
}

export interface MonthlyPeriodInfo {
  id: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  name: string;
  status: string;
}

const monthName = (m: number) =>
  ['January','February','March','April','May','June','July','August','September','October','November','December'][m];

const periodNameFor = (year: number, month: number, employeeName: string) =>
  `${monthName(month)} ${year} — ${employeeName}`;

export const useMonthlyPayrollPersistence = () => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  /** Find existing period for (employee, year, month) or create a new draft one. */
  const getOrCreatePeriod = useCallback(async (params: {
    employeeId: string;
    employeeName: string;
    year: number;
    month: number; // 0-11
    startDate: Date;
    endDate: Date;
    payDate: Date;
  }): Promise<MonthlyPeriodInfo | null> => {
    if (!user) return null;
    const name = periodNameFor(params.year, params.month, params.employeeName);
    const startStr = format(params.startDate, 'yyyy-MM-dd');
    const endStr = format(params.endDate, 'yyyy-MM-dd');
    const payStr = format(params.payDate, 'yyyy-MM-dd');

    // Look up by user + name (idempotent for same employee+month)
    const { data: existing, error: lookupErr } = await supabase
      .from('payroll_periods')
      .select('id, start_date, end_date, pay_date, name, status')
      .eq('user_id', user.id)
      .eq('name', name)
      .maybeSingle();

    if (lookupErr) {
      console.error('Lookup period error', lookupErr);
    }
    if (existing) return existing as MonthlyPeriodInfo;

    const { data: created, error: insertErr } = await supabase
      .from('payroll_periods')
      .insert({
        user_id: user.id,
        name,
        start_date: startStr,
        end_date: endStr,
        pay_date: payStr,
        status: 'draft',
      })
      .select('id, start_date, end_date, pay_date, name, status')
      .single();

    if (insertErr) {
      console.error('Create period error', insertErr);
      return null;
    }
    return created as MonthlyPeriodInfo;
  }, [user]);

  /** Load saved week snapshots for a period+employee, keyed by week_number. */
  const loadWeeks = useCallback(async (periodId: string, employeeId: string): Promise<Record<number, WeekSnapshot>> => {
    const { data, error } = await supabase
      .from('payroll_entries')
      .select('week_number, week_start_date, week_end_date, days_worked, hours_worked, gross_pay, recorded_pay, nis_employee_contribution, nis_employer_contribution, net_pay')
      .eq('payroll_period_id', periodId)
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Load weeks error', error);
      return {};
    }
    const result: Record<number, WeekSnapshot> = {};
    (data || []).forEach((row: any) => {
      if (row.week_number == null) return;
      result[row.week_number] = {
        daysWorked: Number(row.days_worked) || 0,
        recordedPay: Number(row.recorded_pay) || 0,
        calculatedPay: Number(row.gross_pay) || 0,
        nisEmployee: Number(row.nis_employee_contribution) || 0,
        nisEmployer: Number(row.nis_employer_contribution) || 0,
        netPay: Number(row.net_pay) || 0,
        weekStart: row.week_start_date,
        weekEnd: row.week_end_date,
      };
    });
    return result;
  }, []);

  /** Upsert a single week's values. */
  const saveWeek = useCallback(async (params: {
    periodId: string;
    employeeId: string;
    weekNumber: number;
    weekStart: Date;
    weekEnd: Date;
    snapshot: Omit<WeekSnapshot, 'weekStart' | 'weekEnd'>;
  }): Promise<boolean> => {
    setBusy(true);
    try {
      const payload = {
        payroll_period_id: params.periodId,
        employee_id: params.employeeId,
        week_number: params.weekNumber,
        week_start_date: format(params.weekStart, 'yyyy-MM-dd'),
        week_end_date: format(params.weekEnd, 'yyyy-MM-dd'),
        days_worked: params.snapshot.daysWorked,
        hours_worked: params.snapshot.daysWorked * 8,
        gross_pay: params.snapshot.calculatedPay,
        recorded_pay: params.snapshot.recordedPay,
        nis_employee_contribution: params.snapshot.nisEmployee,
        nis_employer_contribution: params.snapshot.nisEmployer,
        net_pay: params.snapshot.netPay,
        other_allowances: 0,
        other_deductions: 0,
        calculated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('payroll_entries')
        .upsert(payload, { onConflict: 'payroll_period_id,employee_id,week_number' });

      if (error) {
        console.error('Save week error', error);
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  /** Reset a saved week's values to zero (keeps the row). */
  const clearWeek = useCallback(async (params: {
    periodId: string;
    employeeId: string;
    weekNumber: number;
    weekStart: Date;
    weekEnd: Date;
  }): Promise<boolean> => {
    return saveWeek({
      ...params,
      snapshot: {
        daysWorked: 0,
        recordedPay: 0,
        calculatedPay: 0,
        nisEmployee: 0,
        nisEmployer: 0,
        netPay: 0,
      },
    });
  }, [saveWeek]);

  return { getOrCreatePeriod, loadWeeks, saveWeek, clearWeek, busy };
};
