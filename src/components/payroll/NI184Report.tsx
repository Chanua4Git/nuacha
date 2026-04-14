import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileText } from 'lucide-react';
import { Employee, PayrollPeriod, PayrollEntry } from '@/types/payroll';
import { EmployerSettings } from '@/types/payroll';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import { format, parseISO, differenceInCalendarWeeks, startOfWeek, addWeeks, isWithinInterval } from 'date-fns';

interface NI184ReportProps {
  period: PayrollPeriod;
  entries: PayrollEntry[];
  employees: Employee[];
  employerSettings: EmployerSettings | null;
}

export const NI184Report: React.FC<NI184ReportProps> = ({
  period,
  entries,
  employees,
  employerSettings,
}) => {
  const startDate = parseISO(period.start_date);
  const endDate = parseISO(period.end_date);
  const totalWeeks = Math.max(1, differenceInCalendarWeeks(endDate, startDate, { weekStartsOn: 1 }) + 1);
  const weekCount = Math.min(totalWeeks, 5);

  // Build week ranges
  const weekRanges = Array.from({ length: weekCount }, (_, i) => {
    const weekStart = addWeeks(startOfWeek(startDate, { weekStartsOn: 1 }), i);
    const weekEnd = addWeeks(weekStart, 1);
    return { start: weekStart, end: weekEnd };
  });

  // Map entries to employees
  const employeeRows = entries.map((entry) => {
    const employee = employees.find((e) => e.id === entry.employee_id);
    if (!employee) return null;

    const totalEmployeeNIS = Number(entry.nis_employee_contribution) || 0;
    const totalEmployerNIS = Number(entry.nis_employer_contribution) || 0;
    const totalContribution = totalEmployeeNIS + totalEmployerNIS;

    // Distribute contributions evenly across weeks
    const weeklyContribution = weekCount > 0 ? totalContribution / weekCount : 0;
    const weeklyValues = Array.from({ length: weekCount }, () =>
      Math.round(weeklyContribution * 100) / 100
    );

    return {
      employee,
      entry,
      totalContribution,
      weeklyValues,
      salaryForPeriod: Number(entry.gross_pay) || 0,
    };
  }).filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          NI 184 — Statement of Contributions Paid / Due
        </h3>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <Card className="print:shadow-none print:border-2 print:border-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg">
            NATIONAL INSURANCE BOARD — FORM NI 184
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Statement of Contributions Paid or Due in Respect of Employed Persons
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {/* Employer Details */}
          <div className="grid grid-cols-2 gap-4 border p-3 rounded">
            <div>
              <span className="font-medium">Trade Name:</span>{' '}
              {employerSettings?.trade_name || '_______________'}
            </div>
            <div>
              <span className="font-medium">Employer Reg. No.:</span>{' '}
              {employerSettings?.employer_reg_no || '_______________'}
            </div>
            <div>
              <span className="font-medium">Address:</span>{' '}
              {employerSettings?.address || '_______________'}
            </div>
            <div>
              <span className="font-medium">Service Centre:</span>{' '}
              {employerSettings?.service_centre_code || '_______________'}
            </div>
            <div>
              <span className="font-medium">Telephone:</span>{' '}
              {employerSettings?.telephone || '_______________'}
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-3 gap-4 border p-3 rounded">
            <div>
              <span className="font-medium">Period From:</span>{' '}
              {format(startDate, 'dd MMM yyyy')}
            </div>
            <div>
              <span className="font-medium">Period To:</span>{' '}
              {format(endDate, 'dd MMM yyyy')}
            </div>
            <div>
              <span className="font-medium">No. of Weeks:</span> {weekCount}
            </div>
          </div>

          {/* Employee Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-2 text-left">NIS No.</th>
                  <th className="border p-2 text-left">Surname & First Name</th>
                  <th className="border p-2 text-center">D.O.B.</th>
                  <th className="border p-2 text-center">Date Employed</th>
                  <th className="border p-2 text-right">Salary for Period</th>
                  {Array.from({ length: weekCount }, (_, i) => (
                    <th key={i} className="border p-2 text-right">WK{i + 1}</th>
                  ))}
                  <th className="border p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {employeeRows.map((row: any) => (
                  <tr key={row.entry.id}>
                    <td className="border p-2">{row.employee.nis_number || '—'}</td>
                    <td className="border p-2">
                      {row.employee.last_name}, {row.employee.first_name}
                    </td>
                    <td className="border p-2 text-center">
                      {row.employee.date_of_birth
                        ? format(parseISO(row.employee.date_of_birth), 'dd/MM/yy')
                        : '—'}
                    </td>
                    <td className="border p-2 text-center">
                      {row.employee.date_hired
                        ? format(parseISO(row.employee.date_hired), 'dd/MM/yy')
                        : '—'}
                    </td>
                    <td className="border p-2 text-right">
                      {formatTTCurrency(row.salaryForPeriod)}
                    </td>
                    {row.weeklyValues.map((val: number, i: number) => (
                      <td key={i} className="border p-2 text-right">
                        {formatTTCurrency(val)}
                      </td>
                    ))}
                    <td className="border p-2 text-right font-medium">
                      {formatTTCurrency(row.totalContribution)}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-muted font-medium">
                  <td colSpan={4} className="border p-2 text-right">
                    TOTALS
                  </td>
                  <td className="border p-2 text-right">
                    {formatTTCurrency(
                      employeeRows.reduce((s: number, r: any) => s + r.salaryForPeriod, 0)
                    )}
                  </td>
                  {Array.from({ length: weekCount }, (_, i) => (
                    <td key={i} className="border p-2 text-right">
                      {formatTTCurrency(
                        employeeRows.reduce((s: number, r: any) => s + r.weeklyValues[i], 0)
                      )}
                    </td>
                  ))}
                  <td className="border p-2 text-right">
                    {formatTTCurrency(
                      employeeRows.reduce((s: number, r: any) => s + r.totalContribution, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground italic">
            I declare that the above statement is correct and that the contributions shown have been
            paid / are due for the period stated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
