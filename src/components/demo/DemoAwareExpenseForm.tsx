import React from 'react';
import ExpenseForm from '@/components/expense-form/ExpenseForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { OCRResult } from '@/types/expense';

interface DemoAwareExpenseFormProps {
  initialOcrData?: OCRResult;
  receiptUrl?: string;
  requireLeadCaptureInDemo?: boolean;
  onScanComplete?: (data: OCRResult, receiptUrl?: string) => void;
  onExpenseCreated?: (ocrData?: OCRResult, receiptUrl?: string) => void;
}

const DemoAwareExpenseForm = ({ initialOcrData, receiptUrl, requireLeadCaptureInDemo, onScanComplete, onExpenseCreated }: DemoAwareExpenseFormProps) => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You're in demo mode. Your expenses are saved locally and won't persist between sessions. 
          Sign up to save your data permanently.
        </AlertDescription>
      </Alert>
      
      <ExpenseForm 
        initialOcrData={initialOcrData}
        receiptUrl={receiptUrl}
        requireLeadCaptureInDemo={requireLeadCaptureInDemo}
        onScanComplete={onScanComplete}
        onExpenseCreated={onExpenseCreated}
      />
    </div>
  );
};

export default DemoAwareExpenseForm;