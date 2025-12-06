import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown, ChevronUp, Plus, Trash2, Receipt } from 'lucide-react';
import { useRecurringPayments, RecurringPayment, PaymentEntry } from '@/hooks/useRecurringPayments';
import { formatTTD } from '@/utils/budgetUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface MonthlyBillTrackerProps {
  familyId: string | null;
  month: Date;
}

const BillRow = ({
  payment,
  onAddPayment,
  onRemoveEntry,
}: {
  payment: RecurringPayment;
  onAddPayment: (key: string, amount: number) => void;
  onRemoveEntry: (key: string, entryId: string) => void;
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleAddPayment = () => {
    const amount = parseFloat(inputValue);
    if (!isNaN(amount) && amount > 0) {
      onAddPayment(payment.category_key, amount);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPayment();
    }
  };

  const progressPercent = payment.budgeted_amount > 0 
    ? Math.min(100, (payment.total_paid / payment.budgeted_amount) * 100)
    : 0;

  const isOverBudget = payment.total_paid > payment.budgeted_amount;
  const hasPayments = payment.payment_entries.length > 0;

  return (
    <div className="py-4 border-b border-border/50 last:border-0">
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          hasPayments 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {hasPayments ? <Check className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
        </div>

        {/* Category info and progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm truncate">{payment.category_name}</p>
            <div className="text-right">
              <span className={`font-semibold text-sm ${isOverBudget ? 'text-destructive' : ''}`}>
                {formatTTD(payment.total_paid)}
              </span>
              <span className="text-muted-foreground text-sm"> / {formatTTD(payment.budgeted_amount)}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-300 ${
                isOverBudget ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Payment input row */}
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1 max-w-[160px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 pl-7 text-sm"
                placeholder="0.00"
              />
            </div>
            <Button 
              size="sm" 
              onClick={handleAddPayment}
              disabled={!inputValue || parseFloat(inputValue) <= 0}
              className="h-9 gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
            
            {hasPayments && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                className="h-9 text-xs text-muted-foreground"
              >
                {payment.payment_entries.length} {payment.payment_entries.length === 1 ? 'entry' : 'entries'}
              </Button>
            )}
          </div>

          {/* Payment history */}
          {showHistory && hasPayments && (
            <div className="mt-3 pl-2 border-l-2 border-primary/20 space-y-1">
              {payment.payment_entries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between text-sm py-1 group"
                >
                  <span className="text-muted-foreground">
                    {format(parseISO(entry.date), 'MMM d')}: {formatTTD(entry.amount)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveEntry(payment.category_key, entry.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MonthlyBillTracker = ({ familyId, month }: MonthlyBillTrackerProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { payments, summary, isLoading, addPayment, removePaymentEntry } = useRecurringPayments(familyId, month);

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
    return null;
  }

  const overallProgress = summary.totalBudgeted > 0 
    ? Math.min(100, (summary.totalPaid / summary.totalBudgeted) * 100)
    : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-medium">
                  Monthly Bills & Essential Expenses
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {summary.categoriesWithPayments} of {summary.totalCount} started
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
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Track your recurring expenses throughout the month. Add each payment as you make it — perfect for weekly fuel, groceries, or any expense that happens multiple times.
            </p>

            <div>
              {payments.map((payment) => (
                <BillRow
                  key={payment.category_key}
                  payment={payment}
                  onAddPayment={addPayment}
                  onRemoveEntry={removePaymentEntry}
                />
              ))}
            </div>

            {summary.totalPaid > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total essential expenses this month</span>
                <span className="font-semibold">{formatTTD(summary.totalPaid)}</span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
