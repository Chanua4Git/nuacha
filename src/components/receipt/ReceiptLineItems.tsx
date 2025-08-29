
import React from 'react';
import { OCRResult } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineItemsTable from './line-items/LineItemsTable';
import LowConfidenceLineItemsAlert from './line-items/LowConfidenceLineItemsAlert';
import { ReceiptLineItem } from '@/types/receipt';
import { useExpense } from '@/context/ExpenseContext';
import { useReceiptDetails } from '@/hooks/useReceiptDetails';
import ExpenseMembersDisplay from '@/components/ExpenseMembersDisplay';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';

interface ReceiptLineItemsProps {
  receiptData: OCRResult;
  expenseId?: string;
}

const ReceiptLineItems: React.FC<ReceiptLineItemsProps> = ({ receiptData, expenseId }) => {
  const hasLineItems = receiptData.lineItems && receiptData.lineItems.length > 0;
  const { selectedFamily } = useExpense();
  const { saveLineItem, lineItems } = useReceiptDetails(expenseId);
  
  // Get unified categories to map suggested budget category IDs to visible category IDs
  const { categories: unifiedCategories, budgetCategories } = useUnifiedCategories({
    familyId: selectedFamily?.id,
    mode: 'unified',
  });
  
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

  // Helper function to map suggested budget category ID to unified category ID
  const mapSuggestedCategoryId = (suggestedId: string | undefined): string | undefined => {
    if (!suggestedId) return undefined;
    
    console.log('Mapping suggested category ID:', suggestedId);
    
    // First, check if the suggested ID exists in unified categories
    const directMatch = unifiedCategories.find(c => c.id === suggestedId);
    if (directMatch) {
      console.log('Direct match found in unified categories:', directMatch.name);
      return suggestedId;
    }
    
    // If not found directly, find the budget category and look for a matching name in unified
    const budgetCategory = budgetCategories.find(c => c.id === suggestedId);
    if (budgetCategory) {
      console.log('Budget category found:', budgetCategory.name);
      
      // Look for a unified category with the same name (case insensitive)
      const nameMatch = unifiedCategories.find(c => 
        c.name.toLowerCase() === budgetCategory.name.toLowerCase()
      );
      
      if (nameMatch) {
        console.log('Found unified category with same name:', nameMatch.name, nameMatch.id);
        return nameMatch.id;
      } else {
        console.log('No unified category found with name:', budgetCategory.name);
      }
    }
    
    console.log('No mapping found for suggested category ID:', suggestedId);
    return suggestedId; // Return original ID as fallback
  };

  // Convert receiptData.lineItems to proper format if needed
  const displayLineItems: ReceiptLineItem[] = expenseId && lineItems.length > 0 
    ? lineItems 
    : (receiptData.lineItems || []).map(item => {
        const mappedCategoryId = mapSuggestedCategoryId(item.suggestedCategoryId);
        console.log('Line item:', item.description, 'original suggested:', item.suggestedCategoryId, 'mapped to:', mappedCategoryId);
        
        return {
          id: undefined,
          expenseId: expenseId || '',
          description: item.description,
          quantity: item.quantity,
          totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : (item.totalPrice || 0),
          categoryId: mappedCategoryId,
          suggestedCategoryId: mappedCategoryId,
          categoryConfidence: item.categoryConfidence,
          sku: item.sku,
          discount: item.discounted
        } as ReceiptLineItem;
      });

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
