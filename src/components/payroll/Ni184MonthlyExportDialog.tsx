import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, FileText } from 'lucide-react';
import { Employee, PayrollEntry } from '@/types/payroll';
import {
  buildNi184Rows,
  downloadCsv,
  getWeekWindowsForMonth,
  ni184Filename,
  rowsToCsv,
} from '@/utils/ni184CsvExport';
import { toast } from 'sonner';

interface Props {
  employees: Employee[];
  entries: PayrollEntry[]; // all payroll entries available
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const Ni184MonthlyExportDialog: React.FC<Props> = ({ employees, entries }) => {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [busy, setBusy] = useState(false);

  const windows = getWeekWindowsForMonth(year, month);
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

  const handleExport = async () => {
    setBusy(true);
    try {
      const effectiveDate = new Date(year, month, 1).toISOString().split('T')[0];
      const rows = await buildNi184Rows(employees, entries, windows, effectiveDate);
      if (rows.length === 0) {
        toast.warning('No payroll data found for the selected month.');
        setBusy(false);
        return;
      }
      const csv = rowsToCsv(rows);
      downloadCsv(ni184Filename(year, month, windows.length), csv);
      toast.success(`Exported ${rows.length} employee${rows.length === 1 ? '' : 's'} for ${MONTHS[month]} ${year}.`);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate CSV.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <FileText className="h-6 w-6" />
          NI 184 Monthly CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export NI 184 Monthly CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Month</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {MONTHS[month]} {year} contains <strong>{windows.length} Monday{windows.length === 1 ? '' : 's'}</strong>,
            so this will be a <strong>{windows.length}-week</strong> file.
            Each WeekN value is the total NIS contribution (employee + employer) for that week,
            calculated from each employee's actual days/hours worked.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleExport} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
