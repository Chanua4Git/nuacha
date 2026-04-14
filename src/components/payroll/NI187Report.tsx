import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, FileText } from 'lucide-react';
import { PayrollPeriod, PayrollEntry } from '@/types/payroll';
import { EmployerSettings } from '@/types/payroll';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import { format, parseISO } from 'date-fns';

interface NI187ReportProps {
  period: PayrollPeriod;
  entries: PayrollEntry[];
  employerSettings: EmployerSettings | null;
}

export const NI187Report: React.FC<NI187ReportProps> = ({
  period,
  entries,
  employerSettings,
}) => {
  const [balanceBF, setBalanceBF] = useState<number>(0);
  const [penalty, setPenalty] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cheque');

  const totalNISEmployee = entries.reduce(
    (s, e) => s + (Number(e.nis_employee_contribution) || 0),
    0
  );
  const totalNISEmployer = entries.reduce(
    (s, e) => s + (Number(e.nis_employer_contribution) || 0),
    0
  );
  const contributionsDue = totalNISEmployee + totalNISEmployer;
  const totalDue = balanceBF + contributionsDue + penalty + interest;
  const balanceCF = totalDue - amountPaid;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          NI 187 — Summary of Contributions Due
        </h3>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <Card className="print:shadow-none print:border-2 print:border-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg">
            NATIONAL INSURANCE BOARD — FORM NI 187
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Summary of Contributions Due
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {/* Section A: Employer Details */}
          <div>
            <h4 className="font-semibold mb-2">Section A — Employer Particulars</h4>
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
              <div>
                <span className="font-medium">No. of Employees:</span>{' '}
                {entries.length}
              </div>
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4 border p-3 rounded">
            <div>
              <span className="font-medium">Contribution Period From:</span>{' '}
              {format(parseISO(period.start_date), 'dd MMM yyyy')}
            </div>
            <div>
              <span className="font-medium">To:</span>{' '}
              {format(parseISO(period.end_date), 'dd MMM yyyy')}
            </div>
          </div>

          {/* Section B: Summary */}
          <div>
            <h4 className="font-semibold mb-2">Section B — Contributions Summary</h4>
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">Employee Contributions (total)</td>
                    <td className="p-3 text-right font-medium">{formatTTCurrency(totalNISEmployee)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Employer Contributions (total)</td>
                    <td className="p-3 text-right font-medium">{formatTTCurrency(totalNISEmployer)}</td>
                  </tr>
                  <tr className="border-b bg-muted">
                    <td className="p-3 font-semibold">Contributions Due This Period</td>
                    <td className="p-3 text-right font-bold">{formatTTCurrency(contributionsDue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Adjustments (editable before printing) */}
          <div className="print:hidden">
            <h4 className="font-semibold mb-2">Adjustments (enter before printing)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="balance_bf" className="text-xs">Balance B/F</Label>
                <Input
                  id="balance_bf"
                  type="number"
                  step="0.01"
                  value={balanceBF}
                  onChange={(e) => setBalanceBF(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="penalty" className="text-xs">Penalty</Label>
                <Input
                  id="penalty"
                  type="number"
                  step="0.01"
                  value={penalty}
                  onChange={(e) => setPenalty(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="interest" className="text-xs">Interest</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.01"
                  value={interest}
                  onChange={(e) => setInterest(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount_paid" className="text-xs">Amount Paid</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Payment Summary (prints) */}
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Balance Brought Forward</td>
                  <td className="p-3 text-right">{formatTTCurrency(balanceBF)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Contributions Due</td>
                  <td className="p-3 text-right">{formatTTCurrency(contributionsDue)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Penalty</td>
                  <td className="p-3 text-right">{formatTTCurrency(penalty)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Interest</td>
                  <td className="p-3 text-right">{formatTTCurrency(interest)}</td>
                </tr>
                <tr className="border-b bg-muted">
                  <td className="p-3 font-semibold">Total Due</td>
                  <td className="p-3 text-right font-bold">{formatTTCurrency(totalDue)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Amount Paid</td>
                  <td className="p-3 text-right">{formatTTCurrency(amountPaid)}</td>
                </tr>
                <tr className="bg-muted">
                  <td className="p-3 font-semibold">Balance Carried Forward</td>
                  <td className="p-3 text-right font-bold">{formatTTCurrency(balanceCF)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border p-3 rounded">
            <span className="font-medium">Payment Method:</span>{' '}
            <span className="print:hidden">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </span>
            <span className="hidden print:inline capitalize">{paymentMethod}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
