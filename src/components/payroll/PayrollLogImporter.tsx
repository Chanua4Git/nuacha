import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
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
  monthKey: string; // YYYY-MM (from sheet name — authoritative)
  monthLabel: string;
  year: number;
  month: number; // 1-12
  weeks: ParsedWeek[];
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

function parseSheetName(name: string): { monthKey: string; monthLabel: string; year: number; month: number } | null {
  const lower = name.toLowerCase();
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
  return { monthKey, monthLabel, year, month };
}

/** Robust date parser. Returns YYYY-MM-DD or null. Pass `anchorYear`/`anchorMonth` to clamp wild years. */
function toISO(v: any, anchorYear?: number, anchorMonth?: number): string | null {
  if (v === null || v === undefined || v === '' || v === '#N/A') return null;
  let y: number | null = null, m: number | null = null, d: number | null = null;

  if (v instanceof Date && !isNaN(v.getTime())) {
    y = v.getUTCFullYear(); m = v.getUTCMonth() + 1; d = v.getUTCDate();
  } else if (typeof v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (!parsed) return null;
    y = parsed.y; m = parsed.m; d = parsed.d;
  } else if (typeof v === 'string') {
    const s = v.trim();
    // DD/MM/YYYY or DD-MM-YYYY (T&T)
    const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (dmy) {
      d = parseInt(dmy[1], 10);
      m = parseInt(dmy[2], 10);
      y = parseInt(dmy[3], 10);
      if (y < 100) y += 2000;
    } else {
      // ISO YYYY-MM-DD
      const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (iso) { y = +iso[1]; m = +iso[2]; d = +iso[3]; }
    }
  }

  if (y == null || m == null || d == null) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  // Sanity guard: if anchor is provided and the parsed year is more than 1 off,
  // the cell is probably mis-typed — assume it actually belongs to the sheet's month.
  if (anchorYear != null && Math.abs(y - anchorYear) > 1) {
    y = anchorYear;
    if (anchorMonth != null) m = anchorMonth;
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    if (rows[i] && rows[i].some((c) => typeof c === 'string' && c.toLowerCase().includes('week start'))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) return null;

  const weeks: ParsedWeek[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const weekStart = toISO(r[0], meta.year, meta.month);
    if (!weekStart) continue;
    weeks.push({
      weekStart,
      weekEnd: toISO(r[1], meta.year, meta.month),
      payDay: toISO(r[2], meta.year, meta.month),
      daysWorked: num(r[10]),
      hourlyRate: num(r[8]),
      dailyRate: num(r[9]),
      calculatedPay: num(r[11]),
      nisEmployee: num(r[12]),
      nisEmployer: num(r[15]),
      recordedPay: num(r[14]),
    });
    if (weeks.length >= 6) break;
  }
  if (!weeks.length) return null;
  return { sheetName, monthKey: meta.monthKey, monthLabel: meta.monthLabel, year: meta.year, month: meta.month, weeks };
}

function parseLegacySheet(ws: XLSX.WorkSheet): ParsedSheet[] {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const grouped = new Map<string, { weeks: ParsedWeek[]; year: number; month: number; label: string }>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const payDay = toISO(r[0]);
    const weekStart = toISO(r[1]) || payDay;
    const weekEnd = toISO(r[2]) || weekStart;
    const ref = weekStart || payDay;
    if (!ref) continue;
    const [yStr, mStr] = ref.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, {
        weeks: [], year, month,
        label: new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      });
    }
    const noWeeks = num(r[7]) || 1;
    const weeklyRate = num(r[8]);
    const salary = num(r[9]) || weeklyRate * noWeeks;
    grouped.get(monthKey)!.weeks.push({
      weekStart, weekEnd, payDay,
      daysWorked: Math.round(noWeeks * 5),
      hourlyRate: 0, dailyRate: 0,
      calculatedPay: salary,
      nisEmployee: 0, nisEmployer: 0,
      recordedPay: salary,
    });
  }
  const out: ParsedSheet[] = [];
  for (const [monthKey, g] of grouped.entries()) {
    out.push({
      sheetName: `Legacy (${monthKey})`,
      monthKey, monthLabel: g.label,
      year: g.year, month: g.month,
      weeks: g.weeks,
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
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<{ ok: number; skipped: number; failed: number; failures: string[] } | null>(null);

  const importTag = `xlsx_import_${employee.id.slice(0, 8)}`;

  const onFile = async (file: File) => {
    setParsing(true);
    setParsed(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheets: ParsedSheet[] = [];
      const seen = new Set<string>();
      // Prefer "New figures" / non-"Old" sheets when there are duplicates
      const orderedNames = [...wb.SheetNames].sort((a, b) => {
        const aOld = a.toLowerCase().includes('old') ? 1 : 0;
        const bOld = b.toLowerCase().includes('old') ? 1 : 0;
        return aOld - bOld;
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

  const clearPrevious = async () => {
    if (!user) return;
    if (!confirm(`Clear all previously imported payroll history for ${employee.first_name} ${employee.last_name}? Your weekly calculator data is not affected.`)) return;
    setClearing(true);
    try {
      const { error } = await supabase
        .from('payroll_periods')
        .delete()
        .eq('user_id', user.id)
        .eq('import_source', importTag);
      if (error) throw error;
      toast.success('Previous import cleared');
      setResult(null);
      onComplete();
    } catch (e: any) {
      toast.error(`Clear failed: ${e.message}`);
    } finally {
      setClearing(false);
    }
  };

  const runImport = async () => {
    if (!parsed || !user) return;
    setImporting(true);
    let ok = 0, skipped = 0, failed = 0;
    const failures: string[] = [];

    // Find existing imported periods by name (which equals monthLabel) — authoritative dedup
    const { data: existing } = await supabase
      .from('payroll_periods')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('import_source', importTag);
    const existingNames = new Set((existing || []).map((p: any) => p.name));

    for (const sheet of parsed) {
      if (existingNames.has(sheet.monthLabel)) {
        skipped++;
        continue;
      }
      try {
        const validWeeks = sheet.weeks.filter((w) => w.weekStart);
        if (!validWeeks.length) { skipped++; continue; }
        // Synthesize period boundaries from sheet's own month, not from week dates
        const monthStart = `${sheet.year}-${String(sheet.month).padStart(2, '0')}-01`;
        const lastDay = new Date(Date.UTC(sheet.year, sheet.month, 0)).getUTCDate();
        const monthEnd = `${sheet.year}-${String(sheet.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const payDate = validWeeks[validWeeks.length - 1].payDay || monthEnd;
        const totalCalc = validWeeks.reduce((s, w) => s + w.calculatedPay, 0);
        const totalNisE = validWeeks.reduce((s, w) => s + w.nisEmployee, 0);
        const totalNisR = validWeeks.reduce((s, w) => s + w.nisEmployer, 0);
        const totalNet = totalCalc - totalNisE;

        const { data: period, error: pErr } = await supabase
          .from('payroll_periods')
          .insert({
            user_id: user.id,
            name: sheet.monthLabel,
            start_date: monthStart,
            end_date: monthEnd,
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

        // Upsert each week individually so one bad row doesn't kill the whole month
        let weekFails = 0;
        for (let idx = 0; idx < validWeeks.length; idx++) {
          const w = validWeeks[idx];
          const derivedRecorded = w.calculatedPay > 0 ? w.calculatedPay - w.nisEmployee : 0;
          const { error: eErr } = await supabase
            .from('payroll_entries')
            .upsert({
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
              recorded_pay: derivedRecorded,
              net_pay: derivedRecorded,
              variance_amount: 0,
              other_deductions: 0,
              other_allowances: 0,
              calculated_at: new Date().toISOString(),
            }, { onConflict: 'payroll_period_id,employee_id,week_number' });
          if (eErr) {
            weekFails++;
            console.error(`Week ${idx + 1} of ${sheet.sheetName} failed:`, eErr);
          }
        }
        if (weekFails === validWeeks.length) {
          throw new Error(`All ${validWeeks.length} weekly rows failed`);
        }
        if (weekFails > 0) {
          failures.push(`${sheet.monthLabel}: ${weekFails}/${validWeeks.length} weeks failed`);
        }
        ok++;
      } catch (e: any) {
        console.error(`Import failed for ${sheet.sheetName}:`, e);
        failures.push(`${sheet.monthLabel}: ${e.message || 'unknown error'}`);
        failed++;
      }
    }
    setResult({ ok, skipped, failed, failures });
    setImporting(false);
    if (failed === 0) {
      toast.success(`Imported ${ok} months. Skipped ${skipped}.`);
    } else {
      toast.warning(`Imported ${ok}. Skipped ${skipped}. Failed ${failed}.`);
    }
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
        <div className="flex flex-wrap gap-2">
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
          <Button onClick={clearPrevious} disabled={clearing || importing} variant="ghost" className="text-destructive">
            {clearing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Clear previous import
          </Button>
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
          <div className="text-sm border rounded-lg p-3 bg-muted/50 space-y-2">
            <div className="flex items-start gap-2">
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
            {result.failures.length > 0 && (
              <div className="pl-6 max-h-40 overflow-auto">
                <p className="font-medium text-xs mb-1">Issues:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {result.failures.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
