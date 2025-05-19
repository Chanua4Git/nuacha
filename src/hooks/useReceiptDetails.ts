
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ReceiptDetail, ReceiptLineItem } from '@/types/receipt';
import { toast } from 'sonner';
import { Json } from '@/types/supabase';
import { CategoryWithCamelCase } from '@/types/expense';

export const useReceiptDetails = (expenseId: string | undefined) => {
  const [receiptDetail, setReceiptDetail] = useState<ReceiptDetail | null>(null);
  const [lineItems, setLineItems] = useState<ReceiptLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch receipt details and line items
  useEffect(() => {
    if (!expenseId) return;
    
    const fetchReceiptData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch receipt details
        const { data: detailData, error: detailError } = await supabase
          .from('receipt_details')
          .select('*')
          .eq('expense_id', expenseId)
          .single();
          
        if (detailError && detailError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw detailError;
        }
        
        // Fetch line items
        const { data: itemsData, error: itemsError } = await supabase
          .from('receipt_line_items')
          .select(`
            *,
            category:category_id(id, name, color),
            suggestedCategory:suggested_category_id(id, name, color)
          `)
          .eq('expense_id', expenseId)
          .order('created_at', { ascending: true });
          
        if (itemsError) {
          throw itemsError;
        }
        
        // Transform to camelCase for our front-end
        if (detailData) {
          let confidenceSummary;
          
          // Fix: Safely extract confidence_summary
          if (detailData.confidence_summary && typeof detailData.confidence_summary === 'object') {
            const cs = detailData.confidence_summary as Record<string, number>;
            confidenceSummary = {
              overall: typeof cs.overall === 'number' ? cs.overall : 0,
              lineItems: typeof cs.line_items === 'number' ? cs.line_items : 0, // Map from snake_case to camelCase
              total: typeof cs.total === 'number' ? cs.total : 0,
              date: typeof cs.date === 'number' ? cs.date : 0,
              merchant: typeof cs.merchant === 'number' ? cs.merchant : 0
            };
          }
          
          setReceiptDetail({
            id: detailData.id,
            expenseId: detailData.expense_id,
            rawData: detailData.raw_data,
            vendorName: detailData.vendor_name,
            vendorAddress: detailData.vendor_address,
            vendorPhone: detailData.vendor_phone,
            vendorWebsite: detailData.vendor_website,
            receiptNumber: detailData.receipt_number,
            transactionTime: detailData.transaction_time,
            subtotal: detailData.subtotal,
            taxAmount: detailData.tax_amount,
            discountAmount: detailData.discount_amount,
            paymentMethod: detailData.payment_method,
            currency: detailData.currency,
            confidenceSummary,
            createdAt: detailData.created_at
          });
        }
        
        if (itemsData && itemsData.length > 0) {
          // Fix: Type safety with the mapper function and proper null handling
          const mappedItems: ReceiptLineItem[] = itemsData.map(item => {
            // Process category and suggestedCategory to ensure they match the expected type
            let category: CategoryWithCamelCase | null = null;
            if (item.category && typeof item.category === 'object' && item.category !== null && 'id' in item.category) {
              category = {
                id: item.category.id,
                name: item.category.name,
                color: item.category.color
              };
            }
            
            let suggestedCategory: CategoryWithCamelCase | null = null;
            if (item.suggestedCategory && typeof item.suggestedCategory === 'object' && item.suggestedCategory !== null && 'id' in item.suggestedCategory) {
              suggestedCategory = {
                id: item.suggestedCategory.id,
                name: item.suggestedCategory.name,
                color: item.suggestedCategory.color
              };
            }
            
            return {
              id: item.id,
              expenseId: item.expense_id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price,
              categoryId: item.category_id,
              suggestedCategoryId: item.suggested_category_id,
              categoryConfidence: item.category_confidence,
              sku: item.sku,
              discount: item.discount,
              createdAt: item.created_at,
              category,
              suggestedCategory,
              isEditing: false
            } as ReceiptLineItem;
          });
          
          setLineItems(mappedItems);
        }
        
      } catch (err: any) {
        console.error('Error fetching receipt data:', err);
        setError(err);
        toast("We had trouble loading the receipt details", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReceiptData();
  }, [expenseId]);
  
  const saveReceiptDetail = async (receiptDetail: ReceiptDetail) => {
    if (!expenseId) return null;
    
    try {
      // Convert to snake_case for database
      const detailToSave = {
        expense_id: expenseId,
        raw_data: receiptDetail.rawData,
        vendor_name: receiptDetail.vendorName,
        vendor_address: receiptDetail.vendorAddress,
        vendor_phone: receiptDetail.vendorPhone,
        vendor_website: receiptDetail.vendorWebsite,
        receipt_number: receiptDetail.receiptNumber,
        transaction_time: receiptDetail.transactionTime,
        subtotal: receiptDetail.subtotal,
        tax_amount: receiptDetail.taxAmount,
        discount_amount: receiptDetail.discountAmount,
        payment_method: receiptDetail.paymentMethod,
        currency: receiptDetail.currency,
        confidence_summary: receiptDetail.confidenceSummary
      };
      
      const { data, error } = await supabase
        .from('receipt_details')
        .upsert([detailToSave])
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state with saved data
      setReceiptDetail({
        ...receiptDetail,
        id: data.id,
        createdAt: data.created_at
      });
      
      toast("Receipt details saved", {
        description: "All your changes have been saved."
      });
      
      return data;
    } catch (err: any) {
      console.error('Error saving receipt detail:', err);
      toast("We couldn't save the receipt details", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };
  
  const saveLineItem = async (lineItem: ReceiptLineItem) => {
    if (!expenseId) return null;
    
    try {
      // Convert to snake_case for database
      const itemToSave = {
        expense_id: expenseId,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit_price: lineItem.unitPrice,
        total_price: lineItem.totalPrice,
        category_id: lineItem.categoryId,
        suggested_category_id: lineItem.suggestedCategoryId,
        category_confidence: lineItem.categoryConfidence,
        sku: lineItem.sku,
        discount: lineItem.discount
      };
      
      let result;
      
      if (lineItem.id) {
        // Update existing line item
        const { data, error } = await supabase
          .from('receipt_line_items')
          .update(itemToSave)
          .eq('id', lineItem.id)
          .select(`
            *,
            category:category_id(id, name, color),
            suggestedCategory:suggested_category_id(id, name, color)
          `)
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Insert new line item
        const { data, error } = await supabase
          .from('receipt_line_items')
          .insert([itemToSave])
          .select(`
            *,
            category:category_id(id, name, color),
            suggestedCategory:suggested_category_id(id, name, color)
          `)
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      // Map result to our frontend type with proper type safety
      let category: CategoryWithCamelCase | null = null;
      if (result.category && typeof result.category === 'object' && result.category !== null && 'id' in result.category) {
        category = {
          id: result.category.id,
          name: result.category.name,
          color: result.category.color
        };
      }
      
      let suggestedCategory: CategoryWithCamelCase | null = null;
      if (result.suggestedCategory && typeof result.suggestedCategory === 'object' && result.suggestedCategory !== null && 'id' in result.suggestedCategory) {
        suggestedCategory = {
          id: result.suggestedCategory.id,
          name: result.suggestedCategory.name,
          color: result.suggestedCategory.color
        };
      }
      
      const mappedResult: ReceiptLineItem = {
        id: result.id,
        expenseId: result.expense_id,
        description: result.description,
        quantity: result.quantity,
        unitPrice: result.unit_price,
        totalPrice: result.total_price,
        categoryId: result.category_id,
        suggestedCategoryId: result.suggested_category_id,
        categoryConfidence: result.category_confidence,
        sku: result.sku,
        discount: result.discount,
        createdAt: result.created_at,
        category,
        suggestedCategory,
        isEditing: false
      };
      
      // Update line items state
      setLineItems(prev => {
        if (lineItem.id) {
          // Replace the existing item
          return prev.map(item => item.id === lineItem.id ? mappedResult : item);
        } else {
          // Add the new item
          return [...prev, mappedResult];
        }
      });
      
      toast("Item saved", {
        description: "Your changes have been saved."
      });
      
      return mappedResult;
    } catch (err: any) {
      console.error('Error saving line item:', err);
      toast("We couldn't save this item", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };
  
  const deleteLineItem = async (lineItemId: string) => {
    try {
      const { error } = await supabase
        .from('receipt_line_items')
        .delete()
        .eq('id', lineItemId);
        
      if (error) throw error;
      
      // Update local state
      setLineItems(prev => prev.filter(item => item.id !== lineItemId));
      
      toast("Item removed", {
        description: "The item has been deleted."
      });
    } catch (err: any) {
      console.error('Error deleting line item:', err);
      toast("We couldn't delete this item", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };
  
  const saveMultipleLineItems = async (items: ReceiptLineItem[]) => {
    if (!expenseId || !items.length) return;
    
    try {
      // Convert all items to snake_case for database
      const itemsToSave = items.map(item => ({
        expense_id: expenseId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        category_id: item.categoryId,
        suggested_category_id: item.suggestedCategoryId,
        category_confidence: item.categoryConfidence,
        sku: item.sku,
        discount: item.discount
      }));
      
      const { data, error } = await supabase
        .from('receipt_line_items')
        .insert(itemsToSave)
        .select(`
          *,
          category:category_id(id, name, color),
          suggestedCategory:suggested_category_id(id, name, color)
        `);
        
      if (error) throw error;
      
      // Map the returned data with proper type safety
      const savedItems: ReceiptLineItem[] = data.map(item => {
        // Process category and suggestedCategory properly
        let category: CategoryWithCamelCase | null = null;
        if (item.category && typeof item.category === 'object' && item.category !== null && 'id' in item.category) {
          category = {
            id: item.category.id,
            name: item.category.name,
            color: item.category.color
          };
        }
        
        let suggestedCategory: CategoryWithCamelCase | null = null;
        if (item.suggestedCategory && typeof item.suggestedCategory === 'object' && item.suggestedCategory !== null && 'id' in item.suggestedCategory) {
          suggestedCategory = {
            id: item.suggestedCategory.id,
            name: item.suggestedCategory.name,
            color: item.suggestedCategory.color
          };
        }
        
        return {
          id: item.id,
          expenseId: item.expense_id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          categoryId: item.category_id,
          suggestedCategoryId: item.suggested_category_id,
          categoryConfidence: item.category_confidence,
          sku: item.sku,
          discount: item.discount,
          createdAt: item.created_at,
          category,
          suggestedCategory,
          isEditing: false
        } as ReceiptLineItem;
      });
      
      // Update line items state
      setLineItems(prev => [...prev, ...savedItems]);
      
      toast(`${savedItems.length} items saved`, {
        description: "All receipt items have been saved."
      });
      
      return savedItems;
    } catch (err: any) {
      console.error('Error saving multiple line items:', err);
      toast("We couldn't save the receipt items", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };
  
  return {
    receiptDetail,
    lineItems,
    isLoading,
    error,
    saveReceiptDetail,
    saveLineItem,
    deleteLineItem,
    saveMultipleLineItems,
  };
};
