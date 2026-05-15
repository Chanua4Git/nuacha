import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Employee } from '@/types/payroll';
import type { MonthGroup, HistoryEntry } from './useEmployeePayrollHistory';
import { getWeekWindowsForMonth } from '@/utils/ni184CsvExport';
import { addDays, parseISO } from 'date-fns';

export interface Ni184BreakdownRow {
  nis: string;
  surname: string;
  firstName: string;
  dob: string; // yyyy-MM-dd
  dateEmployed: string;
  salaryForPeriod: number;
  weeks: number[]; // length 5
}

const cache = new Map<string, { employee: number; employer: number; gross: number }>();

async function lookupNis(weeklyEarnings: number, effectiveDate: string) {
  if (weeklyEarnings <= 0) return { employee: 0, employer: 0, gross: 0 };
  const key = `${weeklyEarnings.toFixed(2)}|${effectiveDate}`;
  if (cache.has(key)) return cache.get(key)!;
  const { data, error } = await supabase.functions.invoke('payroll-api', {
    body: { action: 'calculate-nis', weekly_earnings: weeklyEarnings, effective_date: effectiveDate },
  });
  if (error || !data) return { employee: 0, employer: 0, gross: weeklyEarnings };
  const result = {
    employee: Number(data.employee_contribution) || 0,
    employer: Number(data.employer_contribution) || 0,
    gross: Number(data.gross_pay) || weeklyEarnings,
  };
  cache.set(key, result);
  return result;
}

function computeWeeklyEarnings(emp: Employee, hours: number, days: number): number {
  if (emp.daily_rate && days > 0) return Number(emp.daily_rate) * days;
  if (emp.hourly_rate && hours > 0) return Number(emp.hourly_rate) * hours;
  if (emp.hourly_rate && days > 0) return Number(emp.hourly_rate) * 8 * days;
  if (emp.weekly_rate && (days > 0 || hours > 0)) return Number(emp.weekly_rate);
  if (emp.monthly_salary && (days > 0 || hours > 0)) return Number(emp.monthly_salary) / 4.333;
  return 0;
}

function inWindow(dateStr: string | null | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = parseISO(dateStr).getTime();
  return d >= start.getTime() && d <= addDays(end, 1).getTime() - 1;
}

export function useNi184MonthlyBreakdown(employee: Employee | undefined, groups: MonthGroup[]) {
  const [rows, setRows] = useState<Map<string, Ni184BreakdownRow>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee || groups.length === 0) {
      setRows(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const next = new Map<string, Ni184BreakdownRow>();
      for (const g of groups) {
        const [yStr, mStr] = g.monthKey.split('-');
        const year = Number(yStr);
        const month = Number(mStr) - 1;
        const windows = getWeekWindowsForMonth(year, month);
        const effectiveDate = `${yStr}-${mStr}-01`;
        const weeks: number[] = [0, 0, 0, 0, 0];
        let salaryForPeriod = 0;
        for (const w of windows) {
          const inWeek = g.entries.filter((e: HistoryEntry) => inWindow(e.week_start_date, w.start, w.end));
          const hours = inWeek.reduce((s, e) => s + (Number(e.hours_worked) || 0), 0);
          const days = inWeek.reduce((s, e) => s + (Number(e.days_worked) || 0), 0);
          const earnings = computeWeeklyEarnings(employee, hours, days);
          if (earnings <= 0) continue;
          const nis = await lookupNis(earnings, effectiveDate);
          weeks[w.index - 1] = Math.round((nis.employee + nis.employer) * 100) / 100;
          salaryForPeriod += nis.gross;
        }
        next.set(g.monthKey, {
          nis: employee.nis_number || '',
          surname: (employee.last_name || '').toUpperCase(),
          firstName: (employee.first_name || '').toUpperCase(),
          dob: employee.date_of_birth || '',
          dateEmployed: employee.date_hired || '',
          salaryForPeriod: Math.round(salaryForPeriod * 100) / 100,
          weeks,
        });
      }
      if (!cancelled) {
        setRows(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employee, groups]);

  return { rows, loading };
}
