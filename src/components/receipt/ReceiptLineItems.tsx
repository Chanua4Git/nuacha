
import React from 'react';
import { OCRResult } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineItemsTable from './line-items/LineItemsTable';
import LowConfidenceLineItemsAlert from './line-items/LowConfidenceLineItemsAlert';

interface ReceiptLineItemsProps {
  receiptData: OCRResult;
}

const ReceiptLineItems: React.FC<ReceiptLineItemsProps> = ({ receiptData }) => {
  const hasLineItems = receiptData.lineItems && receiptData.lineItems.length > 0;
  
  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (!hasLineItems) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Items Purchased</CardTitle>
      </CardHeader>
      <CardContent>
        <LineItemsTable 
          lineItems={receiptData.lineItems} 
          formatCurrency={formatCurrency} 
        />
        <LowConfidenceLineItemsAlert lineItems={receiptData.lineItems} />
      </CardContent>
    </Card>
  );
};

export default ReceiptLineItems;
