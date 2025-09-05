
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
  isDemo?: boolean;
}

const ReceiptLineItems: React.FC<ReceiptLineItemsProps> = ({ receiptData, expenseId, isDemo = false }) => {
  const hasLineItems = receiptData.lineItems && receiptData.lineItems.length > 0;
  const { selectedFamily } = useExpense();
  const { saveLineItem, lineItems } = useReceiptDetails(isDemo ? undefined : expenseId);
  
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
    
    // Handle sample categories from OCR processing
    if (suggestedId.startsWith('sample-')) {
      console.log('Handling sample category:', suggestedId);
      const sampleMapping = {
        'sample-dining': ['dining', 'dining out', 'restaurant', 'takeout', 'entertainment'],
        'sample-groceries': ['groceries', 'food', 'grocery'],
        'sample-transport': ['transport', 'transportation', 'travel', 'fuel', 'gas'],
        'sample-shopping': ['shopping', 'retail', 'clothing', 'personal care'],
        'sample-entertainment': ['entertainment', 'leisure', 'recreation', 'hobbies'],
        'sample-healthcare': ['healthcare', 'medical', 'health', 'pharmacy'],
        'sample-utilities': ['utilities', 'bills', 'electricity', 'water', 'internet']
      };

      const searchTerms = sampleMapping[suggestedId as keyof typeof sampleMapping];
      if (searchTerms) {
        for (const term of searchTerms) {
          const matchedCategory = unifiedCategories.find(c => 
            c.name.toLowerCase().includes(term.toLowerCase())
          );
          if (matchedCategory) {
            console.log('Mapped sample category', suggestedId, 'to', matchedCategory.name);
            return matchedCategory.id;
          }
        }
      }
      
      // Fallback for unhandled sample categories
      const wantsCategory = unifiedCategories.find(c => c.groupType === 'wants');
      if (wantsCategory) {
        console.log('Using wants category as sample fallback:', wantsCategory.name);
        return wantsCategory.id;
      }
    }
    
    // Handle special fallback category IDs from the backend
    if (suggestedId === 'groceries-fallback') {
      console.log('Handling groceries fallback - looking for Groceries category');
      const groceriesCategory = unifiedCategories.find(c => 
        c.name.toLowerCase().includes('groceries') || 
        c.name.toLowerCase() === 'groceries'
      );
      if (groceriesCategory) {
        console.log('Found Groceries category for fallback:', groceriesCategory.name, groceriesCategory.id);
        return groceriesCategory.id;
      }
    }
    
    if (suggestedId === 'dining-out-fallback') {
      console.log('Handling dining out fallback - looking for Dining out category');
      const diningCategory = unifiedCategories.find(c => 
        c.name.toLowerCase().includes('dining') || 
        c.name.toLowerCase() === 'dining out' ||
        c.name.toLowerCase().includes('dining out / takeout') ||
        c.name.toLowerCase().includes('takeout') ||
        c.name.toLowerCase().includes('restaurant') ||
        c.name.toLowerCase().includes('entertainment') // Fallback to entertainment if no dining category
      );
      if (diningCategory) {
        console.log('Found Dining out category for fallback:', diningCategory.name, diningCategory.id);
        return diningCategory.id;
      } else {
        console.log('No dining out category found in unified categories, using first wants category');
        // Ultimate fallback - use any "wants" category
        const wantsCategory = unifiedCategories.find(c => c.groupType === 'wants');
        if (wantsCategory) {
          console.log('Using wants category as ultimate fallback:', wantsCategory.name);
          return wantsCategory.id;
        }
      }
    }
    
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
    
    // Additional safety net: check if it's a plain category name and find by name
    if (typeof suggestedId === 'string') {
      const plainNameMatch = unifiedCategories.find(c => 
        c.name.toLowerCase() === suggestedId.toLowerCase()
      );
      if (plainNameMatch) {
        console.log('Found category by plain name matching:', plainNameMatch.name, plainNameMatch.id);
        return plainNameMatch.id;
      }
    }
    
    console.log('No mapping found for suggested category ID:', suggestedId);
    return undefined; // Return undefined to indicate no valid mapping found
  };

  // Convert receiptData.lineItems to proper format if needed
  const displayLineItems: ReceiptLineItem[] = expenseId && lineItems.length > 0 
    ? lineItems 
    : (receiptData.lineItems || []).map(item => {
        const mappedCategoryId = mapSuggestedCategoryId(item.suggestedCategoryId);
        
        // Validate that the mapped category actually exists in available categories
        const categoryExists = mappedCategoryId && unifiedCategories.some(c => c.id === mappedCategoryId);
        const finalCategoryId = categoryExists ? mappedCategoryId : undefined;
        
        console.log('Line item:', item.description, 'original suggested:', item.suggestedCategoryId, 'mapped to:', mappedCategoryId, 'exists:', categoryExists, 'final:', finalCategoryId);
        
        return {
          id: undefined,
          expenseId: expenseId || '',
          description: item.description,
          quantity: item.quantity,
          totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : (item.totalPrice || 0),
          categoryId: finalCategoryId, // This will auto-populate the dropdown
          suggestedCategoryId: finalCategoryId,
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
          vendorName={receiptData.place || receiptData.storeDetails?.name}
          allLineItems={displayLineItems}
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
