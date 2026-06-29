import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronRight, Download, FileText, Upload, ScrollText, Check, X, MessageCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useEmployeePayrollHistory, type MonthGroup, type HistoryEntry } from '@/hooks/useEmployeePayrollHistory';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import type { Employee } from '@/types/payroll';
import { PayrollLogImporter } from './PayrollLogImporter';
import { PayslipDialog } from './PayslipDialog';
import { NisRemittanceCell } from './NisRemittanceCell';
import { useEmployerSettings } from '@/hooks/useEmployerSettings';
import { useNi184MonthlyBreakdown, type Ni184BreakdownRow } from '@/hooks/useNi184MonthlyBreakdown';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Props {
  employees: Employee[];
}

type ViewMode = 'weekly' | 'monthly';

const PRESET_RANGES: Record<string, () => { from: string; to: string } | null> = {
  all: () => null,
  this_year: () => {
    const y = new Date().getFullYear();
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  },
  last_year: () => {
    const y = new Date().getFullYear() - 1;
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  },
  this_month: () => {
    const d = new Date();
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0');
    return { from: `${y}-${m}-01`, to: `${y}-${m}-31` };
  },
};

export const PayrollLog: React.FC<Props> = ({ employees }) => {
  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id || '');
  const [view, setView] = useState<ViewMode>('weekly');
  const [range, setRange] = useState<string>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showImporter, setShowImporter] = useState(false);
  const [payslipEntries, setPayslipEntries] = useState<HistoryEntry[] | null>(null);
  const [rangeMode, setRangeMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { settings: employerSettings } = useEmployerSettings();

  const { monthGroups, loading, refresh } = useEmployeePayrollHistory(employeeId);
  const employee = employees.find((e) => e.id === employeeId);
  const { rows: ni184Rows } = useNi184MonthlyBreakdown(employee, monthGroups);

  const filteredGroups = useMemo(() => {
    const r = PRESET_RANGES[range]?.();
    if (!r) return monthGroups;
    return monthGroups.filter((g) => {
      const ref = g.entries[0]?.week_start_date;
      if (!ref) return true;
      return ref >= r.from && ref <= r.to;
    });
  }, [monthGroups, range]);

  const grandTotals = useMemo(() => {
    return filteredGroups.reduce(
      (acc, g) => ({
        weeks: acc.weeks + g.totals.weeks,
        days: acc.days + g.totals.days,
        calculated: acc.calculated + g.totals.calculated,
        nisEmp: acc.nisEmp + g.totals.nisEmployee,
        nisEmpr: acc.nisEmpr + g.totals.nisEmployer,
        totalNIS: acc.totalNIS + g.totals.totalNIS,
        recorded: acc.recorded + g.totals.recorded,
      }),
      { weeks: 0, days: 0, calculated: 0, nisEmp: 0, nisEmpr: 0, totalNIS: 0, recorded: 0 }
    );
  }, [filteredGroups]);

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleExportCSV = () => {
    if (!employee) return;
    const header = [
      'Month', 'Week Start', 'Week End', 'Pay Day', 'Days Worked',
      'Calculated Pay', 'NIS Employee', 'Calc Pay less NIS',
      'Recorded Pay', 'NIS Employer', 'Total NIS', 'Variance', 'Notes',
      'Entry Date', 'Paid On Date',
    ].join(',');
    const rows: string[] = [];
    for (const g of filteredGroups) {
      for (const e of g.entries) {
        rows.push([
          `"${g.monthLabel}"`,
          e.week_start_date || '',
          e.week_end_date || '',
          e.pay_date || '',
          e.days_worked,
          e.gross_pay.toFixed(2),
          e.nis_employee_contribution.toFixed(2),
          (e.gross_pay - e.nis_employee_contribution).toFixed(2),
          e.recorded_pay.toFixed(2),
          e.nis_employer_contribution.toFixed(2),
          (e.nis_employee_contribution + e.nis_employer_contribution).toFixed(2),
          e.variance_amount.toFixed(2),
          `"${(e.variance_notes || '').replace(/"/g, '""')}"`,
          e.entry_date || '',
          e.paid_on_date || '',
        ].join(','));
      }
    }
    const csv = header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_log_${employee.first_name}_${employee.last_name}_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!employee) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const employerName = employerSettings?.trade_name || 'Employer';
    const styles = `
      <style>
        body { font-family: 'Inter', sans-serif; padding: 24px; color: #2F2F2F; }
        h1 { color: #5A7684; margin-bottom: 4px; }
        .meta { color: #5C5C5C; font-size: 12px; margin-bottom: 16px; }
        h2 { color: #5A7684; margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 4px; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
        th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
        th { background: #F4E8D3; }
        .num { text-align: right; }
        .subtotal { font-weight: 600; background: #FAF9F7; }
        .grand { font-weight: 700; background: #F4E8D3; font-size: 13px; }
        @media print { body { padding: 12px; } }
      </style>
    `;
    let html = `<!DOCTYPE html><html><head><title>Payroll Log — ${employee.first_name} ${employee.last_name}</title>${styles}</head><body>`;
    html += `<h1>Payroll Log</h1>`;
    html += `<div class="meta">${employerName} · ${employee.first_name} ${employee.last_name}`;
    if (employee.nis_number) html += ` · NIS#: ${employee.nis_number}`;
    html += `<br>Range: ${range.replace('_', ' ')} · Generated: ${new Date().toLocaleDateString()}</div>`;

    for (const g of filteredGroups.slice().reverse()) {
      html += `<h2>${g.monthLabel}</h2>`;
      html += `<table><thead><tr>
        <th>Week Start</th><th>Week End</th><th>Pay Day</th><th class="num">Days</th>
        <th class="num">Calc Pay</th><th class="num">NIS Emp.</th><th class="num">Pay less NIS Emp</th><th class="num">Recorded</th>
        <th class="num">NIS Empr.</th><th class="num">Total NIS</th>
        <th>Entry Date</th><th>Paid On</th>
      </tr></thead><tbody>`;
      for (const e of g.entries) {
        html += `<tr>
          <td>${e.week_start_date || ''}</td>
          <td>${e.week_end_date || ''}</td>
          <td>${e.pay_date || ''}</td>
          <td class="num">${e.days_worked}</td>
          <td class="num">${formatTTCurrency(e.gross_pay)}</td>
          <td class="num">${formatTTCurrency(e.nis_employee_contribution)}</td>
          <td class="num">${formatTTCurrency(e.gross_pay - e.nis_employee_contribution)}</td>
          <td class="num">${formatTTCurrency(e.recorded_pay)}</td>
          <td class="num">${formatTTCurrency(e.nis_employer_contribution)}</td>
          <td class="num">${formatTTCurrency(e.nis_employee_contribution + e.nis_employer_contribution)}</td>
          <td>${e.entry_date || ''}</td>
          <td>${e.paid_on_date || ''}</td>
        </tr>`;
      }
      html += `<tr class="subtotal"><td colspan="3">Month total</td>
        <td class="num">${g.totals.days}</td>
        <td class="num">${formatTTCurrency(g.totals.calculated)}</td>
        <td class="num">${formatTTCurrency(g.totals.nisEmployee)}</td>
        <td class="num">${formatTTCurrency(g.totals.calculated - g.totals.nisEmployee)}</td>
        <td class="num">${formatTTCurrency(g.totals.recorded)}</td>
        <td class="num">${formatTTCurrency(g.totals.nisEmployer)}</td>
        <td class="num">${formatTTCurrency(g.totals.totalNIS)}</td>
        <td></td><td></td>
      </tr></tbody></table>`;
      const br = ni184Rows.get(g.monthKey);
      if (br) {
        html += `<table style="margin-top:6px"><thead><tr>
          <th>NationalInsurance</th><th>Surname</th><th>FirstName</th><th>DateOfBirth</th><th>DateEmployed</th>
          <th class="num">SalaryForPeriod</th>
          <th class="num">Week1</th><th class="num">Week2</th><th class="num">Week3</th><th class="num">Week4</th><th class="num">Week5</th>
        </tr></thead><tbody><tr>
          <td>${br.nis}</td><td>${br.surname}</td><td>${br.firstName}</td><td>${br.dob}</td><td>${br.dateEmployed}</td>
          <td class="num">${formatTTCurrency(br.salaryForPeriod)}</td>
          ${br.weeks.map((w) => `<td class="num">${w.toFixed(2)}</td>`).join('')}
        </tr></tbody></table>`;
      }
    }

    html += `<h2>Grand total</h2>`;
    html += `<table><tr class="grand">
      <td>${grandTotals.weeks} weeks · ${grandTotals.days} days</td>
      <td class="num">Calc: ${formatTTCurrency(grandTotals.calculated)}</td>
      <td class="num">NIS Emp: ${formatTTCurrency(grandTotals.nisEmp)}</td>
      <td class="num">Recorded: ${formatTTCurrency(grandTotals.recorded)}</td>
      <td class="num">NIS Empr: ${formatTTCurrency(grandTotals.nisEmpr)}</td>
      <td class="num">Total NIS: ${formatTTCurrency(grandTotals.totalNIS)}</td>
    </tr></table>`;
    html += `<p class="meta" style="margin-top:24px">Generated by Nuacha — ${new Date().toLocaleString()}</p>`;
    html += `<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>`;
    html += `</body></html>`;

    w.document.write(html);
    w.document.close();
  };

  if (!employees.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Add an employee first to see their payroll log.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Payroll Log
              </CardTitle>
              <CardDescription>
                Every week and month an employee has been paid — kept for as long as you need.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={rangeMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (rangeMode && selectedIds.size > 0) {
                    const all = filteredGroups.flatMap((g) => g.entries);
                    const picked = all.filter((e) => selectedIds.has(e.id))
                      .sort((a, b) => (a.week_start_date || '').localeCompare(b.week_start_date || ''));
                    if (picked.length) setPayslipEntries(picked);
                  } else {
                    setRangeMode((s) => !s);
                    setSelectedIds(new Set());
                  }
                }}
                disabled={!employee}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {rangeMode
                  ? selectedIds.size > 0
                    ? `Payslip (${selectedIds.size})`
                    : 'Pick weeks…'
                  : 'Multi-week payslip'}
              </Button>
              {rangeMode && (
                <Button variant="ghost" size="sm" onClick={() => { setRangeMode(false); setSelectedIds(new Set()); }}>
                  Cancel
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowImporter((s) => !s)}>
                <Upload className="h-4 w-4 mr-2" />
                {showImporter ? 'Hide importer' : 'Import from Excel'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredGroups.length}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button size="sm" onClick={handleExportPDF} disabled={!filteredGroups.length}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Employee</label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Date range</label>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="this_year">This year</SelectItem>
                  <SelectItem value="last_year">Last year</SelectItem>
                  <SelectItem value="this_month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">View</label>
              <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
            <SummaryChip label="Weeks" value={String(grandTotals.weeks)} />
            <SummaryChip label="Calculated" value={formatTTCurrency(grandTotals.calculated)} />
            <SummaryChip label="Pay less NIS" value={formatTTCurrency(grandTotals.calculated - grandTotals.nisEmp)} />
            <SummaryChip label="Recorded" value={formatTTCurrency(grandTotals.recorded)} />
            <SummaryChip label="NIS Employee" value={formatTTCurrency(grandTotals.nisEmp)} />
            <SummaryChip label="Total NIS" value={formatTTCurrency(grandTotals.totalNIS)} />
          </div>
        </CardContent>
      </Card>

      {showImporter && employee && (
        <PayrollLogImporter employee={employee} onComplete={refresh} />
      )}

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading log…</CardContent></Card>
      ) : filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nothing here yet — once weeks are saved, they'll appear here.
          </CardContent>
        </Card>
      ) : view === 'monthly' ? (
        <MonthlyTable groups={filteredGroups} expanded={expandedMonths} onToggle={toggleMonth} />
      ) : (
        <WeeklyView
          groups={filteredGroups}
          ni184Rows={ni184Rows}
          onRefresh={refresh}
          onPayslip={(entry) => setPayslipEntries([entry])}
          rangeMode={rangeMode}
          selectedIds={selectedIds}
          employeeId={employeeId}
          onToggleSelect={(id) => setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          })}
        />
      )}

      {employee && payslipEntries && (
        <PayslipDialog
          open={!!payslipEntries}
          onOpenChange={(o) => { if (!o) setPayslipEntries(null); }}
          employee={employee}
          entries={payslipEntries}
        />
      )}
    </div>
  );
};

const SummaryChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border rounded-lg px-3 py-2 bg-muted/30">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);

interface WeeklyViewProps {
  groups: MonthGroup[];
  ni184Rows: Map<string, Ni184BreakdownRow>;
  onRefresh: () => void;
  onPayslip: (entry: HistoryEntry) => void;
  rangeMode: boolean;
  selectedIds: Set<string>;
  employeeId: string;
  onToggleSelect: (id: string) => void;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ groups, ni184Rows, onRefresh, onPayslip, rangeMode, selectedIds, employeeId, onToggleSelect }) => (
  <div className="space-y-4">
    {groups.map((g) => {
      const br = ni184Rows.get(g.monthKey);
      return (
      <Card key={g.monthKey}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{g.monthLabel}</span>
            <Badge variant="secondary">{g.totals.weeks} {g.totals.weeks === 1 ? 'week' : 'weeks'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                {rangeMode && <th className="w-8 py-2 px-2"></th>}
                <th className="text-left py-2 px-2">Week start</th>
                <th className="text-left py-2 px-2">Week end</th>
                <th className="text-left py-2 px-2">Pay day</th>
                <th className="text-right py-2 px-2">Days</th>
                <th className="text-right py-2 px-2">Calc Pay</th>
                <th className="text-right py-2 px-2">NIS Emp.</th>
                <th className="text-right py-2 px-2">Pay less NIS Emp</th>
                <th className="text-right py-2 px-2">Recorded</th>
                <th className="text-right py-2 px-2">NIS Empr.</th>
                <th className="text-right py-2 px-2">Total NIS</th>
                <th className="text-left py-2 px-2">Entry date</th>
                <th className="text-left py-2 px-2">Paid on</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {g.entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  {rangeMode && (
                    <td className="py-2 px-2">
                      <Checkbox
                        checked={selectedIds.has(e.id)}
                        onCheckedChange={() => onToggleSelect(e.id)}
                        aria-label="Select week for payslip"
                      />
                    </td>
                  )}
                  <td className="py-2 px-2">{e.week_start_date || '—'}</td>
                  <td className="py-2 px-2">{e.week_end_date || '—'}</td>
                  <td className="py-2 px-2">{e.pay_date || '—'}</td>
                  <td className="py-2 px-2 text-right">{e.days_worked}</td>
                  <td className="py-2 px-2 text-right">{formatTTCurrency(e.gross_pay)}</td>
                  <td className="py-2 px-2 text-right">{formatTTCurrency(e.nis_employee_contribution)}</td>
                  <td className="py-2 px-2 text-right font-medium">{formatTTCurrency(e.gross_pay - e.nis_employee_contribution)}</td>
                  <td className="py-2 px-2 text-right">{formatTTCurrency(e.recorded_pay)}</td>
                  <td className="py-2 px-2 text-right">{formatTTCurrency(e.nis_employer_contribution)}</td>
                  <td className="py-2 px-2 text-right">{formatTTCurrency(e.nis_employee_contribution + e.nis_employer_contribution)}</td>
                  <td className="py-2 px-2 text-muted-foreground">{e.entry_date || '—'}</td>
                  <td className="py-2 px-2"><PaidOnCell entry={e} onSaved={onRefresh} /></td>
                  <td className="py-2 px-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => onPayslip(e)}
                      aria-label="Send payslip"
                      title="Send payslip via WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/40 font-medium">
                <td colSpan={rangeMode ? 4 : 3} className="py-2 px-2">Subtotal</td>
                <td className="py-2 px-2 text-right">{g.totals.days}</td>
                <td className="py-2 px-2 text-right">{formatTTCurrency(g.totals.calculated)}</td>
                <td className="py-2 px-2 text-right">{formatTTCurrency(g.totals.nisEmployee)}</td>
                <td className="py-2 px-2 text-right">{formatTTCurrency(g.totals.calculated - g.totals.nisEmployee)}</td>
                <td className="py-2 px-2 text-right">{formatTTCurrency(g.totals.recorded)}</td>
                <td className="py-2 px-2 text-right">{formatTTCurrency(g.totals.nisEmployer)}</td>
                <td className="py-2 px-2 text-right">{formatTTCurrency(g.totals.totalNIS)}</td>
                <td colSpan={3} className="py-2 px-2">
                  {employeeId && (
                    <NisRemittanceCell
                      employeeId={employeeId}
                      periodMonth={`${g.monthKey}-01`}
                      totalNis={g.totals.totalNIS}
                    />
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          {br && (
            <div className="mt-3 border-t pt-3">
              <div className="text-xs text-muted-foreground mb-1">NI 184 monthly breakdown</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1 px-2">NationalInsurance</th>
                    <th className="text-left py-1 px-2">Surname</th>
                    <th className="text-left py-1 px-2">FirstName</th>
                    <th className="text-left py-1 px-2">DateOfBirth</th>
                    <th className="text-left py-1 px-2">DateEmployed</th>
                    <th className="text-right py-1 px-2">SalaryForPeriod</th>
                    <th className="text-right py-1 px-2">Week1</th>
                    <th className="text-right py-1 px-2">Week2</th>
                    <th className="text-right py-1 px-2">Week3</th>
                    <th className="text-right py-1 px-2">Week4</th>
                    <th className="text-right py-1 px-2">Week5</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-accent/30">
                    <td className="py-1 px-2">{br.nis || '—'}</td>
                    <td className="py-1 px-2">{br.surname}</td>
                    <td className="py-1 px-2">{br.firstName}</td>
                    <td className="py-1 px-2">{br.dob || '—'}</td>
                    <td className="py-1 px-2">{br.dateEmployed || '—'}</td>
                    <td className="py-1 px-2 text-right">{formatTTCurrency(br.salaryForPeriod)}</td>
                    {br.weeks.map((w, i) => (
                      <td key={i} className="py-1 px-2 text-right">{w.toFixed(2)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      );
    })}
  </div>
);

const PaidOnCell: React.FC<{ entry: HistoryEntry; onSaved: () => void }> = ({ entry, onSaved }) => {
  const [value, setValue] = useState<string>(entry.paid_on_date || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const dirty = (value || '') !== (entry.paid_on_date || '');

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('payroll_entries')
      .update({ paid_on_date: value || null })
      .eq('id', entry.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save paid date', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: value ? 'Marked as paid' : 'Cleared paid date' });
    onSaved();
  };

  const clear = async () => {
    setValue('');
    setSaving(true);
    const { error } = await supabase
      .from('payroll_entries')
      .update({ paid_on_date: null })
      .eq('id', entry.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Could not clear', description: error.message, variant: 'destructive' });
      return;
    }
    onSaved();
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-[140px] text-xs"
        disabled={saving}
      />
      {dirty && (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save} disabled={saving} aria-label="Save paid date">
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}
      {!dirty && entry.paid_on_date && (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={clear} disabled={saving} aria-label="Clear paid date">
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

const MonthlyTable: React.FC<{ groups: MonthGroup[]; expanded: Set<string>; onToggle: (k: string) => void }> = ({ groups, expanded, onToggle }) => (
  <Card>
    <CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs bg-muted/30">
            <th className="text-left py-3 px-4 w-8"></th>
            <th className="text-left py-3 px-2">Month</th>
            <th className="text-right py-3 px-2">Weeks</th>
            <th className="text-right py-3 px-2">Days</th>
            <th className="text-right py-3 px-2">Calculated</th>
            <th className="text-right py-3 px-2">Pay less NIS Emp</th>
            <th className="text-right py-3 px-2">Recorded</th>
            <th className="text-right py-3 px-2">NIS Emp.</th>
            <th className="text-right py-3 px-2">NIS Empr.</th>
            <th className="text-right py-3 px-2">Total NIS</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const isOpen = expanded.has(g.monthKey);
            return (
              <React.Fragment key={g.monthKey}>
                <tr className="border-b cursor-pointer hover:bg-muted/30" onClick={() => onToggle(g.monthKey)}>
                  <td className="py-3 px-4">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </td>
                  <td className="py-3 px-2 font-medium">{g.monthLabel}</td>
                  <td className="py-3 px-2 text-right">{g.totals.weeks}</td>
                  <td className="py-3 px-2 text-right">{g.totals.days}</td>
                  <td className="py-3 px-2 text-right">{formatTTCurrency(g.totals.calculated)}</td>
                  <td className="py-3 px-2 text-right font-medium">{formatTTCurrency(g.totals.calculated - g.totals.nisEmployee)}</td>
                  <td className="py-3 px-2 text-right">{formatTTCurrency(g.totals.recorded)}</td>
                  <td className="py-3 px-2 text-right">{formatTTCurrency(g.totals.nisEmployee)}</td>
                  <td className="py-3 px-2 text-right">{formatTTCurrency(g.totals.nisEmployer)}</td>
                  <td className="py-3 px-2 text-right">{formatTTCurrency(g.totals.totalNIS)}</td>
                </tr>
                {isOpen && (
                  <tr><td colSpan={11} className="bg-muted/10 p-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-1">Week start</th>
                          <th className="text-left py-1">Week end</th>
                          <th className="text-right py-1">Days</th>
                          <th className="text-right py-1">Calc Pay</th>
                          <th className="text-right py-1">NIS Emp.</th>
                          <th className="text-right py-1">Pay less NIS Emp</th>
                          <th className="text-right py-1">Recorded</th>
                          <th className="text-right py-1">NIS Empr.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.entries.map((e) => (
                          <tr key={e.id}>
                            <td className="py-1">{e.week_start_date || '—'}</td>
                            <td className="py-1">{e.week_end_date || '—'}</td>
                            <td className="py-1 text-right">{e.days_worked}</td>
                            <td className="py-1 text-right">{formatTTCurrency(e.gross_pay)}</td>
                            <td className="py-1 text-right">{formatTTCurrency(e.nis_employee_contribution)}</td>
                            <td className="py-1 text-right font-medium">{formatTTCurrency(e.gross_pay - e.nis_employee_contribution)}</td>
                            <td className="py-1 text-right">{formatTTCurrency(e.recorded_pay)}</td>
                            <td className="py-1 text-right">{formatTTCurrency(e.nis_employer_contribution)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td></tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </CardContent>
  </Card>
);
