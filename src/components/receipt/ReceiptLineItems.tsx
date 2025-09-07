
import React from 'react';
import { OCRResult } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineItemsTable from './line-items/LineItemsTable';
import LowConfidenceLineItemsAlert from './line-items/LowConfidenceLineItemsAlert';
import { ReceiptLineItem } from '@/types/receipt';
import { useContextAwareExpense } from '@/hooks/useContextAwareExpense';
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
  const { selectedFamily, isDemo: contextIsDemo } = useContextAwareExpense();
  const { saveLineItem, lineItems } = useReceiptDetails(isDemo ? undefined : expenseId);
  
  // Use unified categories which handles both demo and regular modes
  const { categories: unifiedCategories, budgetCategories } = useUnifiedCategories({
    familyId: selectedFamily?.id,
    mode: 'unified',
    includeDemo: isDemo || contextIsDemo
  });
  
  // Use unified categories as the single source of truth
  const availableCategories = unifiedCategories;
  
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
    console.log('Available categories for mapping:', availableCategories.map(c => ({ id: c.id, name: c.name })));
    
    // Handle sample categories from OCR processing
    if (suggestedId.startsWith('sample-')) {
      console.log('Handling sample category:', suggestedId);
      const sampleMapping = {
        'sample-dining': ['dining', 'dining out', 'restaurant', 'takeout', 'entertainment'],
        'sample-groceries': ['groceries', 'food', 'grocery', 'household'],
        'sample-transport': ['transport', 'transportation', 'travel', 'fuel', 'gas'],
        'sample-shopping': ['shopping', 'retail', 'clothing', 'personal care'],
        'sample-entertainment': ['entertainment', 'leisure', 'recreation', 'hobbies'],
        'sample-healthcare': ['healthcare', 'medical', 'health', 'pharmacy'],
        'sample-utilities': ['utilities', 'bills', 'electricity', 'water', 'internet']
      };

      const searchTerms = sampleMapping[suggestedId as keyof typeof sampleMapping];
      if (searchTerms) {
        console.log('Searching for terms:', searchTerms);
        for (const term of searchTerms) {
          // Try exact word match first, then partial match
          const exactMatch = availableCategories.find(c => {
            const categoryWords = c.name.toLowerCase().split(/[\s&/]+/);
            return categoryWords.includes(term.toLowerCase());
          });
          
          if (exactMatch) {
            console.log('Found exact word match:', term, '->', exactMatch.name, '(', exactMatch.id, ')');
            return exactMatch.id;
          }
          
          // Fallback to partial match
          const partialMatch = availableCategories.find(c => 
            c.name.toLowerCase().includes(term.toLowerCase())
          );
          if (partialMatch) {
            console.log('Found partial match:', term, '->', partialMatch.name, '(', partialMatch.id, ')');
            return partialMatch.id;
          }
        }
      }
      
      console.log('No mapping found for sample category, using fallback');
      // Fallback for unhandled sample categories
      const wantsCategory = availableCategories.find(c => 'groupType' in c && c.groupType === 'wants') || 
                           availableCategories.find(c => c.name.toLowerCase().includes('want')) ||
                           availableCategories[0]; // Ultimate fallback
      if (wantsCategory) {
        console.log('Using wants category as sample fallback:', wantsCategory.name);
        return wantsCategory.id;
      }
    }
    
    // Handle special fallback category IDs from the backend
    if (suggestedId === 'groceries-fallback') {
      console.log('Handling groceries fallback - looking for Groceries category');
      const groceriesCategory = availableCategories.find(c => 
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
      const diningCategory = availableCategories.find(c => 
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
        console.log('No dining out category found in available categories, using first wants category');
        // Ultimate fallback - use any "wants" category or first available
        const wantsCategory = availableCategories.find(c => 'groupType' in c && c.groupType === 'wants') ||
                             availableCategories.find(c => c.name.toLowerCase().includes('want')) ||
                             availableCategories[0]; // Ultimate fallback
        if (wantsCategory) {
          console.log('Using wants category as ultimate fallback:', wantsCategory.name);
          return wantsCategory.id;
        }
      }
    }
    
    // First, check if the suggested ID exists in available categories
    const directMatch = availableCategories.find(c => c.id === suggestedId);
    if (directMatch) {
      console.log('Direct match found in available categories:', directMatch.name);
      return suggestedId;
    }
    
    // If not found directly, find the budget category and look for a matching name in available
    const budgetCategory = budgetCategories.find(c => c.id === suggestedId);
    if (budgetCategory) {
      console.log('Budget category found:', budgetCategory.name);
      
      // Look for an available category with the same name (case insensitive)
      const nameMatch = availableCategories.find(c => 
        c.name.toLowerCase() === budgetCategory.name.toLowerCase()
      );
      
      if (nameMatch) {
        console.log('Found available category with same name:', nameMatch.name, nameMatch.id);
        return nameMatch.id;
      } else {
        console.log('No available category found with name:', budgetCategory.name);
      }
    }
    
    // Additional safety net: check if it's a plain category name and find by name
    if (typeof suggestedId === 'string') {
      const plainNameMatch = availableCategories.find(c => 
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
        const categoryExists = mappedCategoryId && availableCategories.some(c => c.id === mappedCategoryId);
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
