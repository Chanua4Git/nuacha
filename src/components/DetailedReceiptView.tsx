
import React from 'react';
import { OCRResult } from '@/types/expense';
import ReceiptSummaryCard from './receipt/ReceiptSummaryCard';
import ReceiptImage from './receipt/ReceiptImage';
import ReceiptLineItems from './receipt/ReceiptLineItems';
import LowConfidenceAlert from './receipt/LowConfidenceAlert';

interface DetailedReceiptViewProps {
  receiptData: OCRResult;
  receiptImage?: string;
  onRetry?: () => void;
}

const DetailedReceiptView: React.FC<DetailedReceiptViewProps> = ({ 
  receiptData, 
  receiptImage,
  onRetry
}) => {
  const isLowConfidence = receiptData.confidence && receiptData.confidence < 0.7;

  return (
    <div className="space-y-4">
      {isLowConfidence && <LowConfidenceAlert onRetry={onRetry} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {receiptImage && <ReceiptImage imageUrl={receiptImage} />}
        <ReceiptSummaryCard receiptData={receiptData} />
      </div>
      
      <ReceiptLineItems receiptData={receiptData} />
    </div>
  );
};

export default DetailedReceiptView;
