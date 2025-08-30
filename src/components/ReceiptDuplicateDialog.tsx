import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DuplicateGroup, getConfidenceLabel, getReasonLabel } from '@/utils/duplicateDetection';
import { format } from 'date-fns';
import { AlertTriangle, Receipt } from 'lucide-react';

interface ReceiptDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateGroups: DuplicateGroup[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ReceiptDuplicateDialog: React.FC<ReceiptDuplicateDialogProps> = ({
  open,
  onOpenChange,
  duplicateGroups,
  onConfirm,
  onCancel,
}) => {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  if (duplicateGroups.length === 0) return null;

  const primaryGroup = duplicateGroups[0];
  const matchingExpenses = primaryGroup.expenses;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Possible Duplicate Receipt</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            We found {matchingExpenses.length} similar expense{matchingExpenses.length > 1 ? 's' : ''} that might be from the same receipt. 
            Would you like to add this expense anyway?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getConfidenceLabel(primaryGroup.confidence)} confidence
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getReasonLabel(primaryGroup.reason)}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Similar expenses found:</p>
            {matchingExpenses.slice(0, 3).map((expense, index) => (
              <Card key={expense.id || index} className="bg-muted/30">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.place}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">${expense.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date + 'T00:00:00'), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {matchingExpenses.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                ...and {matchingExpenses.length - 3} more similar expense{matchingExpenses.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={handleCancel} className="w-full sm:w-auto">
            Cancel - Don't add expense
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="w-full sm:w-auto">
            Add anyway - It's different
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};