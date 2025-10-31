
import React from 'react';
import { OCRResult } from '@/types/expense';
import ReceiptSummaryCard from './receipt/ReceiptSummaryCard';
import ReceiptImage from './receipt/ReceiptImage';
import ReceiptLineItems from './receipt/ReceiptLineItems';
import LowConfidenceAlert from './receipt/LowConfidenceAlert';
import { Alert, AlertDescription } from './ui/alert';
import { detectPartialReceipt, calculateLineItemsSubtotal } from '@/utils/receipt/mergeReceipts';
import { AlertCircle } from 'lucide-react';

interface DetailedReceiptViewProps {
  receiptData: OCRResult;
  receiptImage?: string;
  onRetry?: () => void;
  expenseId?: string;
  isDemo?: boolean;
}

const DetailedReceiptView: React.FC<DetailedReceiptViewProps> = ({ 
  receiptData, 
  receiptImage,
  onRetry,
  expenseId,
  isDemo = false
}) => {
  const isLowConfidence = receiptData.confidence && receiptData.confidence < 0.7;
  const partialDetection = detectPartialReceipt(receiptData);
  const subtotal = receiptData.lineItems ? calculateLineItemsSubtotal(receiptData.lineItems) : 0;

  return (
    <div className="space-y-4">
      {isLowConfidence && <LowConfidenceAlert onRetry={onRetry} />}
      
      {/* Partial Receipt Warning */}
      {partialDetection.isPartial && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Partial Receipt</div>
            <div className="text-sm text-muted-foreground mt-1">
              {partialDetection.reason}
            </div>
            {subtotal > 0 && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Subtotal from scanned items: </span>
                <span className="text-lg font-semibold">${subtotal.toFixed(2)}</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {receiptImage && <ReceiptImage imageUrl={receiptImage} />}
        <ReceiptSummaryCard receiptData={receiptData} />
      </div>
      
      <ReceiptLineItems receiptData={receiptData} expenseId={expenseId} isDemo={isDemo} />
    </div>
  );
};

export default DetailedReceiptView;
