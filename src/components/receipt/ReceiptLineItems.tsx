
import React, { useEffect } from 'react';
import { OCRResult } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineItemsTable from './line-items/LineItemsTable';
import LowConfidenceLineItemsAlert from './line-items/LowConfidenceLineItemsAlert';
import { ReceiptLineItem } from '@/types/receipt';
import { useExpense } from '@/context/ExpenseContext';
import { useReceiptDetails } from '@/hooks/useReceiptDetails';
import ExpenseMembersDisplay from '@/components/ExpenseMembersDisplay';

interface ReceiptLineItemsProps {
  receiptData: OCRResult;
  expenseId?: string;
}

const ReceiptLineItems: React.FC<ReceiptLineItemsProps> = ({ receiptData, expenseId }) => {
  const hasLineItems = receiptData.lineItems && receiptData.lineItems.length > 0;
  const { selectedFamily } = useExpense();
  const { saveLineItem, lineItems } = useReceiptDetails(expenseId);
  
  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (!hasLineItems) return null;

  const handleSaveLineItem = async (lineItem: ReceiptLineItem): Promise<void> => {
    if (saveLineItem) {
      await saveLineItem(lineItem);
    }
    return Promise.resolve();
  };

  // Convert receiptData.lineItems to proper format if needed
  const displayLineItems: ReceiptLineItem[] = expenseId && lineItems.length > 0 
    ? lineItems 
    : (receiptData.lineItems || []).map(item => ({
        ...item,
        expenseId: expenseId || '',
        totalPrice: item.totalPrice.toString()
      }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Items Purchased</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LineItemsTable 
          lineItems={displayLineItems} 
          formatCurrency={formatCurrency}
          onSaveLineItem={expenseId ? handleSaveLineItem : undefined}
          familyId={selectedFamily?.id}
          expenseId={expenseId}
        />
        <LowConfidenceLineItemsAlert lineItems={receiptData.lineItems} />
        
        {expenseId && selectedFamily && (
          <div className="pt-4 border-t">
            <ExpenseMembersDisplay 
              expenseId={expenseId} 
              familyId={selectedFamily.id} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptLineItems;
