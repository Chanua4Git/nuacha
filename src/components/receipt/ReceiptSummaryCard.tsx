
import React from 'react';
import { OCRResult } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, CreditCard, MapPin, Calendar, Clock } from 'lucide-react';

interface ReceiptSummaryCardProps {
  receiptData: OCRResult;
}

const ReceiptSummaryCard: React.FC<ReceiptSummaryCardProps> = ({ receiptData }) => {
  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
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
          <div className="flex justify-between py-1">
            <dt className="text-muted-foreground">Store:</dt>
            <dd className="font-medium">{receiptData.storeDetails?.name || receiptData.description || '-'}</dd>
          </div>
          
          <div className="flex justify-between py-1">
            <dt className="text-muted-foreground">Date:</dt>
            <dd className="font-medium flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
              {formatDate(receiptData.date)}
            </dd>
          </div>
          
          {receiptData.transactionTime && (
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Time:</dt>
              <dd className="font-medium flex items-center">
                <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                {formatTime(receiptData.transactionTime.value)}
              </dd>
            </div>
          )}
          
          {receiptData.subtotal && (
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Subtotal:</dt>
              <dd className="font-medium">{formatCurrency(receiptData.subtotal.amount)}</dd>
            </div>
          )}
          
          {receiptData.tax && (
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Tax:</dt>
              <dd className="font-medium">{formatCurrency(receiptData.tax.amount)}</dd>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between py-1">
            <dt className="text-muted-foreground">Total:</dt>
            <dd className="font-medium text-lg">{formatCurrency(receiptData.amount)}</dd>
          </div>
          
          {receiptData.paymentMethod && (
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Paid with:</dt>
              <dd className="font-medium flex items-center">
                <CreditCard className="w-3 h-3 mr-1 text-muted-foreground" />
                {receiptData.paymentMethod.type}
                {receiptData.paymentMethod.lastDigits && ` (${receiptData.paymentMethod.lastDigits})`}
              </dd>
            </div>
          )}
          
          {receiptData.storeDetails?.address && (
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Address:</dt>
              <dd className="font-medium text-right flex items-start">
                <MapPin className="w-3 h-3 mr-1 mt-1 text-muted-foreground" />
                <span>{receiptData.storeDetails.address}</span>
              </dd>
            </div>
          )}
          
          {receiptData.receiptNumber && (
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Receipt #:</dt>
              <dd className="font-medium">{receiptData.receiptNumber.value}</dd>
            </div>
          )}
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
