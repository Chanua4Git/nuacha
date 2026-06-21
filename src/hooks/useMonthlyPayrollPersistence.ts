import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { endOfMonth, format, startOfMonth } from 'date-fns';

/**
 * Per-week payroll persistence keyed on a monthly payroll_periods row.
 * Each (period, employee, week_start_date) is a single payroll_entries row,
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
  regularDays?: number;
  holidayDays?: number;
  holidayMultiplier?: number | null;
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

const basePeriodNameFor = (year: number, month: number) =>
  `${monthName(month)} ${year}`;

const periodNameFor = (year: number, month: number, employeeName: string) =>
  `${basePeriodNameFor(year, month)} — ${employeeName}`;

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
    const baseName = basePeriodNameFor(params.year, params.month);
    const startStr = format(params.startDate, 'yyyy-MM-dd');
    const endStr = format(params.endDate, 'yyyy-MM-dd');
    const payStr = format(params.payDate, 'yyyy-MM-dd');
    const monthStartStr = format(startOfMonth(params.startDate), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(params.startDate), 'yyyy-MM-dd');

    const { data: monthPeriods, error: lookupErr } = await supabase
      .from('payroll_periods')
      .select('id, start_date, end_date, pay_date, name, status, created_at')
      .eq('user_id', user.id)
      .gte('start_date', monthStartStr)
      .lte('start_date', monthEndStr)
      .order('created_at', { ascending: true });

    if (lookupErr) {
      console.error('Lookup period error', lookupErr);
    }

    const periods = (monthPeriods || []) as Array<MonthlyPeriodInfo & { created_at?: string }>;

    const importerPeriod = periods.find((period) => period.name === baseName);
    if (importerPeriod) return importerPeriod;

    if (periods.length > 0) {
      const { data: employeePeriods, error: employeePeriodErr } = await supabase
        .from('payroll_entries')
        .select('payroll_period_id')
        .eq('employee_id', params.employeeId)
        .in('payroll_period_id', periods.map((period) => period.id));

      if (employeePeriodErr) {
        console.error('Lookup employee month periods error', employeePeriodErr);
      } else {
        const matchingPeriodIds = new Set((employeePeriods || []).map((row: any) => row.payroll_period_id));
        const matchingPeriod = periods.find((period) => matchingPeriodIds.has(period.id));
        if (matchingPeriod) return matchingPeriod;
      }

      const exactNamedPeriod = periods.find((period) => period.name === name);
      if (exactNamedPeriod) return exactNamedPeriod;

      return periods[0];
    }

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

  /** Load saved week snapshots for a period+employee, keyed by week_start_date. */
  const loadWeeks = useCallback(async (periodId: string, employeeId: string): Promise<Record<string, WeekSnapshot>> => {
    const { data, error } = await supabase
      .from('payroll_entries')
      .select('week_number, week_start_date, week_end_date, days_worked, hours_worked, gross_pay, recorded_pay, nis_employee_contribution, nis_employer_contribution, net_pay')
      .eq('payroll_period_id', periodId)
      .eq('employee_id', employeeId)
      .order('week_start_date', { ascending: true });

    if (error) {
      console.error('Load weeks error', error);
      return {};
    }
    const result: Record<string, WeekSnapshot> = {};
    (data || []).forEach((row: any) => {
      if (!row.week_start_date) return;
      result[row.week_start_date] = {
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
        .upsert(payload, { onConflict: 'payroll_period_id,employee_id,week_start_date' });

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
