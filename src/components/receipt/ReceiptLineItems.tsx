
import React from 'react';
import { OCRResult, ReceiptLineItem } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receiptData.lineItems.map((item: ReceiptLineItem, index: number) => (
              <TableRow key={index}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">{item.quantity || 1}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {receiptData.lineItems.some(item => item.confidence < 0.6) && (
          <Alert className="mt-4 bg-yellow-50">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Some items may not have been detected with high confidence. Please verify the details.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptLineItems;
