import { Employee, PayrollEntry } from '@/types/payroll';
import { supabase } from '@/lib/supabase';
import { addDays, format, parseISO } from 'date-fns';

export interface WeekWindow {
  index: number; // 1..5
  start: Date;
  end: Date; // inclusive (Sunday)
}

/**
 * Returns one window (Mon..Sun) for each Monday that falls inside the calendar month.
 * 4 Mondays → 4 windows; 5 Mondays → 5 windows.
 */
export function getWeekWindowsForMonth(year: number, month: number): WeekWindow[] {
  // month: 0-indexed (JS Date convention)
  const windows: WeekWindow[] = [];
  const firstOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstOfMonth.getDay(); // 0=Sun..6=Sat
  // Monday offset: how many days from 1st to first Monday
  const offset = (8 - dayOfWeek) % 7; // if Mon (1) → 0; Sun (0) → 1; Tue (2) → 6
  let cursor = new Date(year, month, 1 + offset);
  let i = 1;
  while (cursor.getMonth() === month) {
    windows.push({
      index: i,
      start: new Date(cursor),
      end: addDays(cursor, 6),
    });
    cursor = addDays(cursor, 7);
    i++;
  }
  return windows;
}

function fmtYYYYMMDD(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'yyyyMMdd');
  } catch {
    return '';
  }
}

function inWindow(dateStr: string | null | undefined, w: WeekWindow): boolean {
  if (!dateStr) return false;
  const d = parseISO(dateStr).getTime();
  return d >= w.start.getTime() && d <= addDays(w.end, 1).getTime() - 1;
}

interface NisLookupResult {
  employee: number;
  employer: number;
  gross: number;
}

async function lookupNis(weeklyEarnings: number, effectiveDate: string): Promise<NisLookupResult> {
  if (weeklyEarnings <= 0) return { employee: 0, employer: 0, gross: 0 };
  const { data, error } = await supabase.functions.invoke('payroll-api', {
    body: {
      action: 'calculate-nis',
      weekly_earnings: weeklyEarnings,
      effective_date: effectiveDate,
    },
  });
  if (error || !data) return { employee: 0, employer: 0, gross: weeklyEarnings };
  return {
    employee: Number(data.employee_contribution) || 0,
    employer: Number(data.employer_contribution) || 0,
    gross: Number(data.gross_pay) || weeklyEarnings,
  };
}

function computeWeeklyEarnings(emp: Employee, hours: number, days: number): number {
  if (emp.daily_rate && days > 0) return Number(emp.daily_rate) * days;
  if (emp.hourly_rate && hours > 0) return Number(emp.hourly_rate) * hours;
  if (emp.hourly_rate && days > 0) return Number(emp.hourly_rate) * 8 * days;
  if (emp.weekly_rate && (days > 0 || hours > 0)) return Number(emp.weekly_rate);
  if (emp.monthly_salary) return Number(emp.monthly_salary) / 4.333;
  return 0;
}

export interface Ni184Row {
  nis: string;
  surname: string;
  firstName: string;
  dob: string;
  dateEmployed: string;
  salaryForPeriod: number;
  weeks: number[]; // length 5 (pad with 0)
}

export async function buildNi184Rows(
  employees: Employee[],
  entries: PayrollEntry[],
  windows: WeekWindow[],
  effectiveDate: string
): Promise<Ni184Row[]> {
  const rows: Ni184Row[] = [];
  for (const emp of employees) {
    const empEntries = entries.filter((e) => e.employee_id === emp.id);
    const weeks: number[] = [0, 0, 0, 0, 0];
    let salaryForPeriod = 0;
    for (const w of windows) {
      // aggregate hours/days for this employee whose week_start_date falls in window
      const weekEntries = empEntries.filter((e) => inWindow(e.week_start_date as any, w));
      const hours = weekEntries.reduce((s, e) => s + (Number(e.hours_worked) || 0), 0);
      const days = weekEntries.reduce((s, e) => s + (Number(e.days_worked) || 0), 0);
      const earnings = computeWeeklyEarnings(emp, hours, days);
      if (earnings <= 0) continue;
      const nis = await lookupNis(earnings, effectiveDate);
      weeks[w.index - 1] = Math.round((nis.employee + nis.employer) * 100) / 100;
      salaryForPeriod += nis.gross;
    }
    if (salaryForPeriod === 0 && weeks.every((v) => v === 0)) continue;
    rows.push({
      nis: emp.nis_number || '',
      surname: (emp.last_name || '').toUpperCase(),
      firstName: (emp.first_name || '').toUpperCase(),
      dob: fmtYYYYMMDD(emp.date_of_birth),
      dateEmployed: fmtYYYYMMDD(emp.date_hired),
      salaryForPeriod: Math.round(salaryForPeriod * 100) / 100,
      weeks,
    });
  }
  return rows;
}

export function rowsToCsv(rows: Ni184Row[]): string {
  const header =
    'NationalInsuranceNumber,Surname,FirstName,DateOfBirth,DateEmployed,SalaryForPeriod,Week1,Week2,Week3,Week4,Week5';
  const lines = rows.map((r) =>
    [
      r.nis,
      r.surname,
      r.firstName,
      r.dob,
      r.dateEmployed,
      r.salaryForPeriod,
      ...r.weeks,
    ].join(',')
  );
  return [header, ...lines].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ni184Filename(year: number, month: number, weekCount: number): string {
  const monthName = format(new Date(year, month, 1), 'MMMM');
  return `NI184_${weekCount}_weeks_${monthName}_${year}_NIS_Contribution_Calculations.csv`;
}
