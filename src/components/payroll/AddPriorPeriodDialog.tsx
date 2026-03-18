import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useEnhancedPayroll } from '@/hooks/useEnhancedPayroll';
import { useToast } from '@/hooks/use-toast';

interface AddPriorPeriodDialogProps {
  onAdded?: () => void;
}

export const AddPriorPeriodDialog: React.FC<AddPriorPeriodDialogProps> = ({ onAdded }) => {
  const [open, setOpen] = useState(false);
  const { savePayrollPeriod, saving } = useEnhancedPayroll();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    payDate: '',
    status: 'paid' as 'draft' | 'calculated' | 'processed' | 'paid',
    totalGrossPay: '',
    totalNisEmployee: '',
    totalNisEmployer: '',
    totalNetPay: '',
    transactionId: '',
    paidDate: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '', startDate: '', endDate: '', payDate: '',
      status: 'paid', totalGrossPay: '', totalNisEmployee: '',
      totalNisEmployer: '', totalNetPay: '', transactionId: '',
      paidDate: '', notes: '',
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate || !form.payDate) {
      toast({ title: "Missing fields", description: "Please fill in the period name, start date, end date, and pay date.", variant: "destructive" });
      return;
    }

    const result = await savePayrollPeriod({
      name: form.name,
      start_date: form.startDate,
      end_date: form.endDate,
      pay_date: form.payDate,
      status: form.status,
      total_gross_pay: parseFloat(form.totalGrossPay) || 0,
      total_nis_employee: parseFloat(form.totalNisEmployee) || 0,
      total_nis_employer: parseFloat(form.totalNisEmployer) || 0,
      total_net_pay: parseFloat(form.totalNetPay) || 0,
      transaction_id: form.transactionId || undefined,
      entered_date: new Date().toISOString(),
      notes: form.notes || undefined,
      payroll_data: {
        source: 'manual_prior_period',
        totals: {
          totalCalculatedPay: parseFloat(form.totalGrossPay) || 0,
          totalNISEmployee: parseFloat(form.totalNisEmployee) || 0,
          totalNISEmployer: parseFloat(form.totalNisEmployer) || 0,
          totalNetPay: parseFloat(form.totalNetPay) || 0,
        }
      },
    });

    if (result) {
      resetForm();
      setOpen(false);
      onAdded?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Prior Period
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Prior Payroll Period</DialogTitle>
          <DialogDescription>
            Record a historical payroll period that wasn't tracked in the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prior-name">Period Name *</Label>
            <Input id="prior-name" placeholder="e.g. January 2026 Week 1-4" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prior-start">Start Date *</Label>
              <Input id="prior-start" type="date" value={form.startDate} onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prior-end">End Date *</Label>
              <Input id="prior-end" type="date" value={form.endDate} onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prior-pay">Pay Date *</Label>
              <Input id="prior-pay" type="date" value={form.payDate} onChange={(e) => setForm(prev => ({ ...prev, payDate: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prior-gross">Total Gross Pay (TTD)</Label>
              <Input id="prior-gross" type="number" step="0.01" placeholder="0.00" value={form.totalGrossPay} onChange={(e) => setForm(prev => ({ ...prev, totalGrossPay: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prior-net">Total Net Pay (TTD)</Label>
              <Input id="prior-net" type="number" step="0.01" placeholder="0.00" value={form.totalNetPay} onChange={(e) => setForm(prev => ({ ...prev, totalNetPay: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prior-nis-ee">NIS Employee (TTD)</Label>
              <Input id="prior-nis-ee" type="number" step="0.01" placeholder="0.00" value={form.totalNisEmployee} onChange={(e) => setForm(prev => ({ ...prev, totalNisEmployee: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prior-nis-er">NIS Employer (TTD)</Label>
              <Input id="prior-nis-er" type="number" step="0.01" placeholder="0.00" value={form.totalNisEmployer} onChange={(e) => setForm(prev => ({ ...prev, totalNisEmployer: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prior-txn">Transaction ID</Label>
              <Input id="prior-txn" placeholder="Reference number" value={form.transactionId} onChange={(e) => setForm(prev => ({ ...prev, transactionId: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prior-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v as any }))}>
                <SelectTrigger id="prior-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="calculated">Calculated</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prior-paid-date">Paid Date</Label>
            <Input id="prior-paid-date" type="date" value={form.paidDate} onChange={(e) => setForm(prev => ({ ...prev, paidDate: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prior-notes">Notes</Label>
            <Textarea id="prior-notes" placeholder="Any additional notes about this period..." value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Prior Period'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
