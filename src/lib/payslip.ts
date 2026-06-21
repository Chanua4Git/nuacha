import { formatTTCurrency } from '@/utils/payrollCalculations';
import type { HistoryEntry } from '@/hooks/useEmployeePayrollHistory';
import type { Employee } from '@/types/payroll';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const fmtRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return '';
  return `${fmtDate(start)} – ${fmtDate(end)}`;
};

export interface PayslipOptions {
  employerName?: string;
  payDateOverride?: string | null;
}

export function formatPayslipText(
  entries: HistoryEntry[],
  employee: Employee,
  opts: PayslipOptions = {}
): string {
  if (!entries.length) return '';

  const single = entries.length === 1;
  const employer = opts.employerName?.trim();

  const totals = entries.reduce(
    (acc, e) => {
      acc.days += e.days_worked;
      acc.gross += e.gross_pay;
      acc.nisEmp += e.nis_employee_contribution;
      acc.regularDays += Number(e.regular_days ?? 0);
      acc.holidayDays += Number(e.holiday_days ?? 0);
      return acc;
    },
    { days: 0, gross: 0, nisEmp: 0, regularDays: 0, holidayDays: 0 }
  );
  const net = totals.gross - totals.nisEmp;

  const divider = '─────────────';
  const lines: string[] = [];

  if (single) {
    const e = entries[0];
    lines.push(`Period: ${fmtRange(e.week_start_date, e.week_end_date)}`);
    if (e.week_number) lines.push(`Week ${e.week_number}`);
    lines.push('');

    const dailyRate = e.days_worked > 0 ? e.gross_pay / e.days_worked : 0;
    const hasHolidayBreakdown =
      e.holiday_days != null && e.holiday_days > 0 && e.holiday_multiplier;

    if (hasHolidayBreakdown && e.regular_days != null) {
      const reg = Number(e.regular_days);
      const hol = Number(e.holiday_days);
      const mult = Number(e.holiday_multiplier);
      const baseRate = reg + hol * mult > 0 ? e.gross_pay / (reg + hol * mult) : dailyRate;
      const regPay = reg * baseRate;
      const holPay = hol * baseRate * mult;
      lines.push(`Regular days: ${reg} × ${formatTTCurrency(baseRate)} = ${formatTTCurrency(regPay)}`);
      lines.push(`Holiday days: ${hol} × ${formatTTCurrency(baseRate)} × ${mult}x = ${formatTTCurrency(holPay)}`);
    } else {
      lines.push(`Days worked: ${e.days_worked}`);
    }
    lines.push(divider);
    lines.push(`Gross pay: ${formatTTCurrency(e.gross_pay)}`);
    if (e.nis_employee_contribution > 0) {
      lines.push(`NIS (employee): -${formatTTCurrency(e.nis_employee_contribution)}`);
    }
    lines.push(divider);
    lines.push(`Net pay: ${formatTTCurrency(net)}`);
    if (e.paid_on_date) lines.push(`Paid on: ${fmtDate(e.paid_on_date)}`);
  } else {
    const first = entries[0];
    const last = entries[entries.length - 1];
    lines.push(`Period: ${fmtDate(first.week_start_date)} – ${fmtDate(last.week_end_date)}`);
    lines.push('');
    for (const e of entries) {
      const wk = e.week_number ? `Wk ${e.week_number}` : fmtDate(e.week_start_date);
      const holNote =
        e.holiday_days && e.holiday_multiplier
          ? ` (incl ${e.holiday_days} hol × ${e.holiday_multiplier}x)`
          : '';
      const netLine = e.gross_pay - e.nis_employee_contribution;
      lines.push(
        `${wk}: ${e.days_worked}d · ${formatTTCurrency(e.gross_pay)} − NIS ${formatTTCurrency(
          e.nis_employee_contribution
        )} = ${formatTTCurrency(netLine)}${holNote}`
      );
    }
    lines.push(divider);
    lines.push(`Total days: ${totals.days}`);
    lines.push(`Gross: ${formatTTCurrency(totals.gross)}`);
    lines.push(`NIS (employee): -${formatTTCurrency(totals.nisEmp)}`);
    lines.push(divider);
    lines.push(`Net pay: ${formatTTCurrency(net)}`);
  }

  lines.push('');
  lines.push(employer ? `From ${employer}` : 'Sent via Nuacha');



  return lines.join('\n');
}

/**
 * Normalise a phone number for WhatsApp's wa.me URL. Defaults to T&T (+1868)
 * when no country code is present.
 */
export function normaliseWhatsAppPhone(raw: string, defaultCountry = '1868'): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  // Already includes country code if starts with 1868, 1, or 7+ digits with leading 1
  if (digits.startsWith('1868')) return digits;
  if (digits.length === 7) return defaultCountry + digits; // local TT 7-digit
  if (digits.length === 10 && digits.startsWith('868')) return '1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  // Fall back: assume user typed full intl number without +
  if (digits.length >= 10) return digits;
  return defaultCountry + digits;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const normalised = normaliseWhatsAppPhone(phone);
  return `https://wa.me/${normalised}?text=${encodeURIComponent(text)}`;
}
