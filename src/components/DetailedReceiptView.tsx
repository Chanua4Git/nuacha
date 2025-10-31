
import React from 'react';
import { OCRResult } from '@/types/expense';
import ReceiptSummaryCard from './receipt/ReceiptSummaryCard';
import ReceiptImage from './receipt/ReceiptImage';
import ReceiptLineItems from './receipt/ReceiptLineItems';
import LowConfidenceAlert from './receipt/LowConfidenceAlert';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { detectPartialReceipt, calculateLineItemsSubtotal } from '@/utils/receipt/mergeReceipts';
import { AlertCircle, Camera, Check, Layers } from 'lucide-react';

interface DetailedReceiptViewProps {
  receiptData: OCRResult;
  receiptImage?: string;
  onRetry?: () => void;
  expenseId?: string;
  isDemo?: boolean;
  onScanNextPage?: () => void;
  onFinalize?: () => void;
  canFinalize?: boolean;
  isComplete?: boolean;
  totalPages?: number;
}

const DetailedReceiptView: React.FC<DetailedReceiptViewProps> = ({ 
  receiptData, 
  receiptImage,
  onRetry,
  expenseId,
  isDemo = false,
  onScanNextPage,
  onFinalize,
  canFinalize,
  isComplete,
  totalPages = 0
}) => {
  const isLowConfidence = receiptData.confidence && receiptData.confidence < 0.7;
  const partialDetection = detectPartialReceipt(receiptData);
  const subtotal = receiptData.lineItems ? calculateLineItemsSubtotal(receiptData.lineItems) : 0;

  // Debug logging for CTA visibility
  console.debug('[DetailedReceiptView] CTA State:', {
    isPartial: partialDetection.isPartial,
    isComplete,
    hasOnScanNextPage: !!onScanNextPage,
    hasOnFinalize: !!onFinalize,
    canFinalize,
    totalPages,
    reason: partialDetection.reason
  });

  return (
    <div className="space-y-4">
      {isLowConfidence && <LowConfidenceAlert onRetry={onRetry} />}
      
      {/* Partial Receipt Warning with inline CTA */}
      {partialDetection.isPartial && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-medium text-yellow-900">Partial Receipt</div>
            <div className="text-sm text-yellow-700 mt-1">
              {partialDetection.reason}
            </div>
            {subtotal > 0 && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Running subtotal: </span>
                <span className="text-lg font-semibold">${subtotal.toFixed(2)}</span>
              </div>
            )}
            {onScanNextPage && !isComplete && (
              <div className="mt-3">
                <Button 
                  onClick={onScanNextPage}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Next Page of Receipt
                </Button>
                <p className="text-xs text-yellow-700 mt-2">
                  Scan the bottom of your receipt to capture the final total
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Receipt Complete with inline finalize CTA */}
      {isComplete && canFinalize && onFinalize && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-900">Receipt Complete!</div>
            <div className="text-sm text-green-700 mt-1">
              All pages scanned. Ready to finalize your receipt.
            </div>
            <div className="mt-3">
              <Button 
                onClick={onFinalize}
                variant="default"
                size="sm"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <Layers className="w-4 h-4 mr-2" />
                Finalize Receipt ({totalPages} {totalPages === 1 ? 'page' : 'pages'})
              </Button>
            </div>
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
