import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown, ChevronUp, Receipt, Zap } from 'lucide-react';
import { useRecurringPayments, RecurringPayment } from '@/hooks/useRecurringPayments';
import { formatTTD } from '@/utils/budgetUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyBillTrackerProps {
  familyId: string | null;
  month: Date;
}

const BillRow = ({
  payment,
  onRecordPayment,
  onRemovePayment,
}: {
  payment: RecurringPayment;
  onRecordPayment: (key: string, amount: number) => void;
  onRemovePayment: (key: string) => void;
}) => {
  const [inputValue, setInputValue] = useState(
    payment.actual_paid?.toString() || ''
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleQuickPay = () => {
    onRecordPayment(payment.category_key, payment.budgeted_amount);
    setInputValue(payment.budgeted_amount.toString());
  };

  const handleCustomPay = () => {
    const amount = parseFloat(inputValue);
    if (!isNaN(amount) && amount > 0) {
      onRecordPayment(payment.category_key, amount);
      setIsEditing(false);
    }
  };

  const handleUnmark = () => {
    onRemovePayment(payment.category_key);
    setInputValue('');
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      {/* Status indicator */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        payment.is_paid 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
          : 'bg-muted text-muted-foreground'
      }`}>
        {payment.is_paid ? <Check className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
      </div>

      {/* Category name and budgeted amount */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{payment.category_name}</p>
        <p className="text-xs text-muted-foreground">
          Budgeted: {formatTTD(payment.budgeted_amount)}
        </p>
      </div>

      {/* Input / Display */}
      <div className="flex items-center gap-2">
        {payment.is_paid && !isEditing ? (
          <>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              {formatTTD(payment.actual_paid || 0)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleUnmark}
            >
              Undo
            </Button>
          </>
        ) : isEditing ? (
          <>
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-24 h-8 text-sm"
              placeholder="0.00"
              autoFocus
            />
            <Button size="sm" onClick={handleCustomPay} className="h-8">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8">
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickPay}
              className="h-8 gap-1"
            >
              <Zap className="w-3 h-3" />
              Pay {formatTTD(payment.budgeted_amount)}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-8 text-xs"
            >
              Custom
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export const MonthlyBillTracker = ({ familyId, month }: MonthlyBillTrackerProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { payments, summary, isLoading, recordPayment, removePayment } = useRecurringPayments(familyId, month);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return null; // Don't show if no essential expenses in template
  }

  const progressPercent = summary.totalCount > 0 
    ? Math.round((summary.paidCount / summary.totalCount) * 100) 
    : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-medium">
                  Monthly Bills & Recurring Expenses
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {summary.paidCount} of {summary.totalCount} recorded
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{formatTTD(summary.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground">of {formatTTD(summary.totalBudgeted)}</p>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Quickly record your recurring bills. Click "Pay" to mark as paid at the budgeted amount, or enter a custom amount.
            </p>

            <div className="divide-y divide-border/50">
              {payments.map((payment) => (
                <BillRow
                  key={payment.category_key}
                  payment={payment}
                  onRecordPayment={recordPayment}
                  onRemovePayment={removePayment}
                />
              ))}
            </div>

            {summary.paidCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total bills recorded this month</span>
                <span className="font-semibold">{formatTTD(summary.totalPaid)}</span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
