
import React from 'react';
import { OCRResult } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Calendar, Clock } from 'lucide-react';
import DataRow from './DataRow';
import PaymentInfo from './PaymentInfo';
import AddressInfo from './AddressInfo';

interface ReceiptSummaryCardProps {
  receiptData: OCRResult;
}

const ReceiptSummaryCard: React.FC<ReceiptSummaryCardProps> = ({ receiptData }) => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(date, 'MMM d, yyyy');
  };
  
  const formatTime = (date: Date | undefined) => {
    if (!date) return '-';
    return format(date, 'h:mm a');
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-100 text-green-800';
    if (confidence > 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Purchase Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <DataRow
            label="Store"
            value={receiptData.storeDetails?.name || receiptData.description || '-'}
          />
          
          <DataRow
            label="Date"
            value={formatDate(receiptData.date)}
            icon={Calendar}
          />
          
          {receiptData.transactionTime && (
            <DataRow
              label="Time"
              value={formatTime(receiptData.transactionTime.value)}
              icon={Clock}
            />
          )}
          
          <PaymentInfo
            subtotal={receiptData.subtotal}
            tax={receiptData.tax}
            total={receiptData.amount}
            paymentMethod={receiptData.paymentMethod}
            lineItems={receiptData.lineItems}
          />
          
          <AddressInfo
            storeDetails={receiptData.storeDetails}
            receiptNumber={receiptData.receiptNumber}
          />
        </dl>
        
        {receiptData.confidence && (
          <div className="mt-4">
            <Badge variant="outline" className={getConfidenceColor(receiptData.confidence)}>
              Detection confidence: {Math.round(receiptData.confidence * 100)}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptSummaryCard;
