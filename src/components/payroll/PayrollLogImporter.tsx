import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';
import type { Employee } from '@/types/payroll';

interface Props {
  employee: Employee;
  onComplete: () => void;
}

interface ParsedWeek {
  weekStart: string | null;
  weekEnd: string | null;
  payDay: string | null;
  daysWorked: number;
  hourlyRate: number;
  dailyRate: number;
  calculatedPay: number;
  nisEmployee: number;
  nisEmployer: number;
  recordedPay: number;
}

interface ParsedSheet {
  sheetName: string;
  monthKey: string; // YYYY-MM
  monthLabel: string;
  weeks: ParsedWeek[];
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

function parseSheetName(name: string): { monthKey: string; monthLabel: string } | null {
  const lower = name.toLowerCase();
  // Skip sheets like "Jan 2020-April 2022" range, "Sheet1", "Attachments"
  if (lower.includes('-april 2022') || lower === 'sheet1' || lower === 'attachments') return null;
  const yearMatch = lower.match(/(20\d{2})/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[1], 10);
  const monthMatch = lower.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*/);
  if (!monthMatch) return null;
  const month = MONTHS[monthMatch[1]];
  if (!month) return null;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { monthKey, monthLabel };
}

function toISO(v: any): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof v === 'string') {
    // Try DD/MM/YYYY first (T&T format)
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      return `${m[3]}-${String(parseInt(m[2], 10)).padStart(2, '0')}-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
    }
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

function num(v: any): number {
  if (v == null || v === '#N/A' || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isFinite(n) ? n : 0;
}

function parseSheet(ws: XLSX.WorkSheet, sheetName: string): ParsedSheet | null {
  const meta = parseSheetName(sheetName);
  if (!meta) return null;
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!rows.length) return null;

  // Find header row containing "Week start"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    if (rows[i] && rows[i].some((c) => typeof c === 'string' && c.toLowerCase().includes('week start'))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) return null;

  // Standard layout (Oct 2022+):
  // 0:Week start 1:Week end 2:Pay day  ... 8:Pay/hr 9:Pay/(8hr)dy 10:Recorded dys worked
  // 11:Calculated Pay 12:NIS Employee 13:Calc Pay less NIS 14:Recorded Pay
  // 15:NIS Employer 16:Total NIS Cont.
  const weeks: ParsedWeek[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const weekStart = toISO(r[0]);
    if (!weekStart) continue;
    weeks.push({
      weekStart,
      weekEnd: toISO(r[1]),
      payDay: toISO(r[2]),
      daysWorked: num(r[10]),
      hourlyRate: num(r[8]),
      dailyRate: num(r[9]),
      calculatedPay: num(r[11]),
      nisEmployee: num(r[12]),
      nisEmployer: num(r[15]),
      recordedPay: num(r[14]),
    });
    if (weeks.length >= 6) break; // max 5 weeks/month
  }
  if (!weeks.length) return null;
  return { sheetName, monthKey: meta.monthKey, monthLabel: meta.monthLabel, weeks };
}

function parseLegacySheet(ws: XLSX.WorkSheet): ParsedSheet[] {
  // "Jan 2020-April 2022" sheet — one row per week
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const grouped = new Map<string, ParsedWeek[]>();
  const labels = new Map<string, string>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const payDay = toISO(r[0]);
    const weekStart = toISO(r[1]);
    const weekEnd = toISO(r[2]);
    const ref = weekStart || payDay;
    if (!ref) continue;
    const d = new Date(ref);
    if (isNaN(d.getTime())) continue;
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
      labels.set(monthKey, d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }));
    }
    const noWeeks = num(r[7]) || 1;
    const weeklyRate = num(r[8]);
    const salary = num(r[9]) || weeklyRate * noWeeks;
    grouped.get(monthKey)!.push({
      weekStart, weekEnd, payDay,
      daysWorked: Math.round(noWeeks * 5),
      hourlyRate: 0,
      dailyRate: 0,
      calculatedPay: salary,
      nisEmployee: 0,
      nisEmployer: 0,
      recordedPay: salary,
    });
  }
  const out: ParsedSheet[] = [];
  for (const [monthKey, weeks] of grouped.entries()) {
    out.push({
      sheetName: `Jan2020-Apr2022 (${monthKey})`,
      monthKey,
      monthLabel: labels.get(monthKey)!,
      weeks,
    });
  }
  return out;
}

export const PayrollLogImporter: React.FC<Props> = ({ employee, onComplete }) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedSheet[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; skipped: number; failed: number } | null>(null);

  const onFile = async (file: File) => {
    setParsing(true);
    setParsed(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheets: ParsedSheet[] = [];
      const seen = new Set<string>();
      // De-duplicate by monthKey: keep "(New figures)" version, skip "(Old Figures)"
      const orderedNames = [...wb.SheetNames].sort((a, b) => {
        const aOld = a.toLowerCase().includes('old');
        const bOld = b.toLowerCase().includes('old');
        if (aOld && !bOld) return 1;
        if (!aOld && bOld) return -1;
        return 0;
      });
      for (const name of orderedNames) {
        const ws = wb.Sheets[name];
        if (!ws) continue;
        if (name.toLowerCase().includes('jan 2020-april 2022')) {
          for (const s of parseLegacySheet(ws)) {
            if (!seen.has(s.monthKey)) { seen.add(s.monthKey); sheets.push(s); }
          }
          continue;
        }
        const s = parseSheet(ws, name);
        if (s && !seen.has(s.monthKey)) {
          seen.add(s.monthKey);
          sheets.push(s);
        }
      }
      sheets.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      setParsed(sheets);
      toast.success(`Parsed ${sheets.length} months from workbook`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to parse: ${e.message}`);
    } finally {
      setParsing(false);
    }
  };

  const runImport = async () => {
    if (!parsed || !user) return;
    setImporting(true);
    let ok = 0, skipped = 0, failed = 0;
    const importTag = `xlsx_import_${employee.id.slice(0, 8)}`;

    // Find existing imported periods to skip
    const { data: existing } = await supabase
      .from('payroll_periods')
      .select('id, name, start_date, import_source')
      .eq('user_id', user.id);
    const existingMonthKeys = new Set(
      (existing || [])
        .filter((p: any) => p.import_source === importTag)
        .map((p: any) => {
          const d = new Date(p.start_date);
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        })
    );

    for (const sheet of parsed) {
      if (existingMonthKeys.has(sheet.monthKey)) {
        skipped++;
        continue;
      }
      try {
        const validWeeks = sheet.weeks.filter((w) => w.weekStart);
        if (!validWeeks.length) { skipped++; continue; }
        const startDate = validWeeks[0].weekStart!;
        const endDate = validWeeks[validWeeks.length - 1].weekEnd || validWeeks[validWeeks.length - 1].weekStart!;
        const payDate = validWeeks[validWeeks.length - 1].payDay || endDate;
        const totalCalc = validWeeks.reduce((s, w) => s + w.calculatedPay, 0);
        const totalNisE = validWeeks.reduce((s, w) => s + w.nisEmployee, 0);
        const totalNisR = validWeeks.reduce((s, w) => s + w.nisEmployer, 0);
        const totalNet = totalCalc - totalNisE;

        const { data: period, error: pErr } = await supabase
          .from('payroll_periods')
          .insert({
            user_id: user.id,
            name: sheet.monthLabel,
            start_date: startDate,
            end_date: endDate,
            pay_date: payDate,
            status: 'paid',
            import_source: importTag,
            total_gross_pay: totalCalc,
            total_nis_employee: totalNisE,
            total_nis_employer: totalNisR,
            total_net_pay: totalNet,
          })
          .select('id')
          .single();
        if (pErr) throw pErr;

        const entryRows = validWeeks.map((w, idx) => ({
          payroll_period_id: period!.id,
          employee_id: employee.id,
          week_number: idx + 1,
          week_start_date: w.weekStart,
          week_end_date: w.weekEnd,
          days_worked: Math.round(w.daysWorked),
          hours_worked: w.daysWorked * 8,
          gross_pay: w.calculatedPay,
          nis_employee_contribution: w.nisEmployee,
          nis_employer_contribution: w.nisEmployer,
          recorded_pay: w.recordedPay,
          net_pay: w.calculatedPay - w.nisEmployee,
          variance_amount: w.recordedPay - (w.calculatedPay - w.nisEmployee),
          other_deductions: 0,
          other_allowances: 0,
          calculated_at: new Date().toISOString(),
        }));
        const { error: eErr } = await supabase.from('payroll_entries').insert(entryRows);
        if (eErr) throw eErr;
        ok++;
      } catch (e: any) {
        console.error(`Import failed for ${sheet.sheetName}:`, e);
        failed++;
      }
    }
    setResult({ ok, skipped, failed });
    setImporting(false);
    toast.success(`Imported ${ok} months. Skipped ${skipped}. Failed ${failed}.`);
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Payroll History from Excel
        </CardTitle>
        <CardDescription>
          Upload your monthly payroll workbook for <strong>{employee.first_name} {employee.last_name}</strong>.
          Each sheet becomes one month in the log. Existing imports for the same month are skipped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <div className="flex gap-2">
          <Button onClick={() => fileRef.current?.click()} disabled={parsing || importing} variant="outline">
            {parsing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Choose .xlsx file
          </Button>
          {parsed && (
            <Button onClick={runImport} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Import {parsed.length} months
            </Button>
          )}
        </div>
        {parsed && !result && (
          <div className="text-sm text-muted-foreground border rounded-lg p-3 max-h-48 overflow-auto">
            <p className="font-medium mb-2">Ready to import:</p>
            <ul className="space-y-1">
              {parsed.map((s) => (
                <li key={s.monthKey}>• {s.monthLabel} — {s.weeks.length} weeks</li>
              ))}
            </ul>
          </div>
        )}
        {result && (
          <div className="text-sm border rounded-lg p-3 bg-muted/50 flex items-start gap-2">
            {result.failed === 0 ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
            )}
            <div>
              <p className="font-medium">Import complete</p>
              <p className="text-muted-foreground">
                {result.ok} imported · {result.skipped} skipped (already exist) · {result.failed} failed
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
