import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Eye, MessageCircle, Copy, Trash2, FileText, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { usePayslipHistory, type PayslipRecord } from '@/hooks/usePayslipHistory';
import { buildWhatsAppUrl } from '@/lib/payslip';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import type { Employee } from '@/types/payroll';

interface Props {
  employees: Employee[];
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

export const PayslipHistory: React.FC<Props> = ({ employees }) => {
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState<string>('all');
  const { records, loading, refresh } = usePayslipHistory(employeeId);
  const [viewing, setViewing] = useState<PayslipRecord | null>(null);
  const [deleting, setDeleting] = useState<PayslipRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const employeeMap = useMemo(() => {
    const m = new Map<string, Employee>();
    employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [employees]);

  const handleCopy = async (r: PayslipRecord) => {
    try {
      await navigator.clipboard.writeText(r.payslip_text);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const handleResend = (r: PayslipRecord) => {
    const phone = r.phone_sent_to || employeeMap.get(r.employee_id)?.phone || '';
    if (!phone) {
      toast({ title: 'No phone number on file', variant: 'destructive' });
      return;
    }
    window.open(buildWhatsAppUrl(phone, r.payslip_text), '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('payslips').delete().eq('id', deleting.id);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payslip removed from history' });
      refresh();
    }
    setDeleting(null);
  };

  if (!employees.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Add an employee first to start sending payslips.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sent payslips
          </CardTitle>
          <CardDescription>
            A copy of every payslip you've sent via WhatsApp — kept here so you can pull them up anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <label className="text-xs text-muted-foreground">Employee</label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No payslips sent yet — when you send one, it'll be kept here.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs bg-muted/30">
                  <th className="text-left py-3 px-3">Employee</th>
                  <th className="text-left py-3 px-3">Period</th>
                  <th className="text-right py-3 px-3">Days</th>
                  <th className="text-right py-3 px-3">Gross</th>
                  <th className="text-right py-3 px-3">NIS</th>
                  <th className="text-right py-3 px-3">Net</th>
                  <th className="text-left py-3 px-3">Sent on</th>
                  <th className="text-left py-3 px-3">Phone</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const emp = employeeMap.get(r.employee_id);
                  const empName = emp ? `${emp.first_name} ${emp.last_name}` : '—';
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{empName}</td>
                      <td className="py-2 px-3 text-xs">{fmtDate(r.period_start)} – {fmtDate(r.period_end)}</td>
                      <td className="py-2 px-3 text-right">{r.days_total}</td>
                      <td className="py-2 px-3 text-right">{formatTTCurrency(r.gross_total)}</td>
                      <td className="py-2 px-3 text-right">{formatTTCurrency(r.nis_employee_total)}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatTTCurrency(r.net_total)}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{fmtDate(r.sent_at)}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{r.phone_sent_to || '—'}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewing(r)} title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleResend(r)} title="Re-send via WhatsApp">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(r)} title="Copy text">
                            {copiedId === r.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(r)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
            <DialogDescription>
              {viewing && employeeMap.get(viewing.employee_id)?.first_name} · sent {viewing && fmtDate(viewing.sent_at)}
            </DialogDescription>
          </DialogHeader>
          <Textarea value={viewing?.payslip_text || ''} readOnly rows={14} className="font-mono text-xs" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => viewing && handleCopy(viewing)}>
              <Copy className="h-4 w-4 mr-2" />Copy
            </Button>
            <Button onClick={() => viewing && handleResend(viewing)}>
              <MessageCircle className="h-4 w-4 mr-2" />Re-send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this payslip from history?</AlertDialogTitle>
            <AlertDialogDescription>
              This only removes the record from your history — it doesn't affect the underlying payroll entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
