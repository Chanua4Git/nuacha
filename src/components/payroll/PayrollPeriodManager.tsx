import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, CreditCard, DollarSign, Eye, Trash2, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PayPalPaymentButton } from './PayPalPaymentButton';
import { useEnhancedPayroll } from '@/hooks/useEnhancedPayroll';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import { useToast } from '@/components/ui/use-toast';

interface PayrollPeriodManagerProps {
  onLoadPeriod?: (periodId: string) => void;
}

export const PayrollPeriodManager: React.FC<PayrollPeriodManagerProps> = ({
  onLoadPeriod
}) => {
  const { 
    payrollPeriods, 
    loading, 
    deletePayrollPeriod, 
    markAsPaid,
    updatePayrollPeriod 
  } = useEnhancedPayroll();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'calculated': return 'bg-blue-500';
      case 'processed': return 'bg-orange-500';
      case 'paid': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'processed': return <CreditCard className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handlePaymentSuccess = async (periodId: string) => {
    try {
      await markAsPaid(periodId, new Date().toISOString(), 'paypal_transaction');
      toast({
        title: "Payment Successful",
        description: "Payroll period has been marked as paid.",
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (periodId: string) => {
    try {
      await deletePayrollPeriod(periodId);
      toast({
        title: "Period Deleted",
        description: "Payroll period has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting period:', error);
      toast({
        title: "Error",
        description: "Failed to delete payroll period. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canProcessPayment = (period: any) => {
    return period.status === 'calculated' && period.total_net_pay > 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payroll periods...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Saved Payroll Periods
        </CardTitle>
        <CardDescription>
          Manage and process your saved payroll calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payrollPeriods.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No payroll periods saved yet</p>
            <p className="text-sm text-muted-foreground">
              Create a payroll calculation first to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">
                      {period.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(period.start_date), 'MMM dd')} - {format(new Date(period.end_date), 'MMM dd, yyyy')}</div>
                        <div className="text-muted-foreground">
                          Pay date: {format(new Date(period.pay_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(period.status)} text-white`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(period.status)}
                          {period.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatTTCurrency(period.total_net_pay)}
                      </div>
                      {period.total_gross_pay > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Gross: {formatTTCurrency(period.total_gross_pay)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPeriod(period)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{period.name}</DialogTitle>
                              <DialogDescription>
                                Payroll period details and payment options
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPeriod && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Period Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <div>Start: {format(new Date(selectedPeriod.start_date), 'PPP')}</div>
                                      <div>End: {format(new Date(selectedPeriod.end_date), 'PPP')}</div>
                                      <div>Pay Date: {format(new Date(selectedPeriod.pay_date), 'PPP')}</div>
                                      <div>Status: <Badge className={`${getStatusColor(selectedPeriod.status)} text-white`}>
                                        {selectedPeriod.status}
                                      </Badge></div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Financial Summary</h4>
                                    <div className="space-y-1 text-sm">
                                      <div>Gross Pay: {formatTTCurrency(selectedPeriod.total_gross_pay)}</div>
                                      <div>NIS Employee: {formatTTCurrency(selectedPeriod.total_nis_employee)}</div>
                                      <div>NIS Employer: {formatTTCurrency(selectedPeriod.total_nis_employer)}</div>
                                      <div className="font-medium">Net Pay: {formatTTCurrency(selectedPeriod.total_net_pay)}</div>
                                    </div>
                                  </div>
                                </div>

                                {selectedPeriod.notes && (
                                  <div>
                                    <h4 className="font-medium mb-2">Notes</h4>
                                    <p className="text-sm text-muted-foreground">{selectedPeriod.notes}</p>
                                  </div>
                                )}

                                {canProcessPayment(selectedPeriod) && (
                                  <div className="border-t pt-4">
                                    <h4 className="font-medium mb-4">Process Payment</h4>
                                    <PayPalPaymentButton
                                      payrollPeriodId={selectedPeriod.id}
                                      amount={selectedPeriod.total_net_pay}
                                      onPaymentSuccess={() => handlePaymentSuccess(selectedPeriod.id)}
                                    />
                                  </div>
                                )}

                                {selectedPeriod.status === 'paid' && selectedPeriod.paid_date && (
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700">
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="font-medium">Payment Completed</span>
                                    </div>
                                    <p className="text-sm text-green-600 mt-1">
                                      Paid on {format(new Date(selectedPeriod.paid_date), 'PPP')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {onLoadPeriod && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onLoadPeriod(period.id)}
                          >
                            Load
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={period.status === 'paid'}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payroll Period</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{period.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(period.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};