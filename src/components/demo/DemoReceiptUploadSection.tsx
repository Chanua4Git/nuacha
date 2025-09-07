import React from 'react';
import ExpenseForm from '@/components/expense-form/ExpenseForm';
import { OCRResult } from '@/types/expense';

interface DemoReceiptUploadSectionProps {
  initialOcrData?: OCRResult;
  receiptUrl?: string;
  requireLeadCaptureInDemo?: boolean;
  onScanComplete?: (data: OCRResult, receiptUrl?: string) => void;
}

const DemoReceiptUploadSection = ({ 
  initialOcrData, 
  receiptUrl, 
  requireLeadCaptureInDemo, 
  onScanComplete 
}: DemoReceiptUploadSectionProps) => {
  return (
    <ExpenseForm 
      initialOcrData={initialOcrData}
      receiptUrl={receiptUrl}
      requireLeadCaptureInDemo={requireLeadCaptureInDemo}
      onScanComplete={onScanComplete}
    />
  );
};

export default DemoReceiptUploadSection;