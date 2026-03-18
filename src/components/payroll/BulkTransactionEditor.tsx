import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Edit2, X, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useEnhancedPayroll } from '@/hooks/useEnhancedPayroll';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import { useToast } from '@/hooks/use-toast';
import { AddPriorPeriodDialog } from './AddPriorPeriodDialog';

interface PeriodEdit {
  transaction_id: string;
  paid_date: string;
  status: string;
  notes: string;
}

export const BulkTransactionEditor: React.FC = () => {
  const { payrollPeriods, updatePayrollPeriod, saving, fetchPayrollPeriods } = useEnhancedPayroll();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState<Record<string, PeriodEdit>>({});
  const [savingBulk, setSavingBulk] = useState(false);

  // Initialize edits from current period data
  const initEdits = useCallback(() => {
    const initial: Record<string, PeriodEdit> = {};
    payrollPeriods.forEach((p) => {
      initial[p.id] = {
        transaction_id: p.transaction_id || '',
        paid_date: p.paid_date ? format(new Date(p.paid_date), 'yyyy-MM-dd') : '',
        status: p.status,
        notes: p.notes || '',
      };
    });
    setEdits(initial);
  }, [payrollPeriods]);

  useEffect(() => {
    initEdits();
  }, [initEdits]);

  const updateEdit = (periodId: string, field: keyof PeriodEdit, value: string) => {
    setEdits(prev => ({
      ...prev,
      [periodId]: { ...prev[periodId], [field]: value }
    }));
  };

  const getEffectiveTotals = (period: any) => {
    const jsonTotals = period.payroll_data?.totals;
    const hasDbTotals = period.total_net_pay > 0 || period.total_gross_pay > 0;
    if (hasDbTotals) return { gross: period.total_gross_pay, netPay: period.total_net_pay };
    if (jsonTotals) return { gross: jsonTotals.totalCalculatedPay || 0, netPay: jsonTotals.totalNetPay || 0 };
    return { gross: 0, netPay: 0 };
  };

  const hasChanges = () => {
    return payrollPeriods.some(p => {
      const edit = edits[p.id];
      if (!edit) return false;
      const origTxn = p.transaction_id || '';
      const origPaid = p.paid_date ? format(new Date(p.paid_date), 'yyyy-MM-dd') : '';
      const origNotes = p.notes || '';
      return edit.transaction_id !== origTxn || edit.paid_date !== origPaid || edit.status !== p.status || edit.notes !== origNotes;
    });
  };

  const getChangedPeriods = () => {
    return payrollPeriods.filter(p => {
      const edit = edits[p.id];
      if (!edit) return false;
      const origTxn = p.transaction_id || '';
      const origPaid = p.paid_date ? format(new Date(p.paid_date), 'yyyy-MM-dd') : '';
      const origNotes = p.notes || '';
      return edit.transaction_id !== origTxn || edit.paid_date !== origPaid || edit.status !== p.status || edit.notes !== origNotes;
    });
  };

  const handleSaveAll = async () => {
    const changed = getChangedPeriods();
    if (changed.length === 0) {
      toast({ title: "No changes", description: "Nothing to save." });
      return;
    }

    setSavingBulk(true);
    let successCount = 0;

    for (const period of changed) {
      const edit = edits[period.id];
      const updates: any = {
        transaction_id: edit.transaction_id || null,
        status: edit.status,
        notes: edit.notes || null,
      };
      if (edit.paid_date) {
        updates.paid_date = new Date(edit.paid_date).toISOString();
      } else {
        updates.paid_date = null;
      }

      const result = await updatePayrollPeriod(period.id, updates);
      if (result) successCount++;
    }

    setSavingBulk(false);
    
    if (successCount === changed.length) {
      toast({ title: "All saved", description: `Updated ${successCount} payroll period(s) successfully.` });
      setEditMode(false);
    } else {
      toast({ title: "Partial save", description: `Updated ${successCount} of ${changed.length} periods.`, variant: "destructive" });
    }
  };

  const handleCancel = () => {
    initEdits();
    setEditMode(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'processed': return <CreditCard className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'calculated': return 'bg-blue-500';
      case 'processed': return 'bg-orange-500';
      case 'paid': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (payrollPeriods.length === 0 && !editMode) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Bulk Transaction Management</CardTitle>
            <CardDescription>Update transaction details across all periods or add prior periods</CardDescription>
          </div>
          <AddPriorPeriodDialog />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No payroll periods saved yet. Use "Add Prior Period" to record historical data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-lg">Bulk Transaction Management</CardTitle>
          <CardDescription>
            {editMode 
              ? `Editing ${payrollPeriods.length} period(s) — make changes and save all at once`
              : 'Update transaction details across all periods or add prior periods'
            }
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <AddPriorPeriodDialog onAdded={() => fetchPayrollPeriods()} />
          {!editMode ? (
            <Button variant="default" size="sm" className="gap-2" onClick={() => setEditMode(true)}>
              <Edit2 className="h-4 w-4" />
              Bulk Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCancel}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                className="gap-2" 
                onClick={handleSaveAll} 
                disabled={savingBulk || !hasChanges()}
              >
                <Save className="h-4 w-4" />
                {savingBulk ? 'Saving...' : `Save All${getChangedPeriods().length > 0 ? ` (${getChangedPeriods().length})` : ''}`}
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Period</TableHead>
                <TableHead className="min-w-[120px]">Dates</TableHead>
                <TableHead className="min-w-[90px]">Net Pay</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[140px]">Transaction ID</TableHead>
                <TableHead className="min-w-[130px]">Paid Date</TableHead>
                <TableHead className="min-w-[140px]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollPeriods.map((period) => {
                const edit = edits[period.id];
                if (!edit) return null;
                const totals = getEffectiveTotals(period);

                return (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium text-sm">{period.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(period.start_date), 'dd MMM')} - {format(new Date(period.end_date), 'dd MMM yy')}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {formatTTCurrency(totals.netPay)}
                    </TableCell>
                    <TableCell>
                      {editMode ? (
                        <Select value={edit.status} onValueChange={(v) => updateEdit(period.id, 'status', v)}>
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="calculated">Calculated</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className={`${getStatusColor(period.status)} text-white text-xs`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(period.status)}
                            {period.status}
                          </div>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editMode ? (
                        <Input
                          className="h-8 text-xs w-[130px]"
                          placeholder="Enter ref ID"
                          value={edit.transaction_id}
                          onChange={(e) => updateEdit(period.id, 'transaction_id', e.target.value)}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">{period.transaction_id || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editMode ? (
                        <Input
                          type="date"
                          className="h-8 text-xs w-[130px]"
                          value={edit.paid_date}
                          onChange={(e) => updateEdit(period.id, 'paid_date', e.target.value)}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {period.paid_date ? format(new Date(period.paid_date), 'dd MMM yyyy') : '—'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editMode ? (
                        <Input
                          className="h-8 text-xs w-[130px]"
                          placeholder="Notes"
                          value={edit.notes}
                          onChange={(e) => updateEdit(period.id, 'notes', e.target.value)}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px] block">{period.notes || '—'}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
