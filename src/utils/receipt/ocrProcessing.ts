
import { OCRResult, ReceiptLineItem as OCRReceiptLineItem } from '@/types/expense';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MindeeResponse } from './types';
import { ReceiptDetail, ReceiptLineItem } from '@/types/receipt';
import { CategoryWithCamelCase } from '@/types/expense';
import { validateAndCorrectDate, showDateValidationWarning } from './dateProcessing';

export async function processReceiptWithEdgeFunction(receiptUrl: string, familyId?: string): Promise<OCRResult> {
  try {
    console.log('📄 Processing receipt:', receiptUrl, 'for family:', familyId);
    
    // Check if this is a local file URL (for demo/unauthenticated users)
    const isLocalFileUrl = receiptUrl.startsWith('blob:');
    let requestBody: any = { receiptUrl, familyId };
    
    // For demo users (unauthenticated), we need to send the file directly
    if (isLocalFileUrl) {
      try {
        console.log('🎯 Demo mode: Converting blob to base64 for OCR processing');
        const response = await fetch(receiptUrl);
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Remove the data URL prefix
            const base64Content = base64data.split(',')[1];
            resolve(base64Content);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
        });
        reader.readAsDataURL(blob);
        
        const base64Content = await base64Promise;
        requestBody = { 
          receiptBase64: base64Content,
          contentType: blob.type,
          isDemo: true,
          familyId
        };
        
        console.log('🎯 Demo mode: Base64 conversion complete, content type:', blob.type);
        
      } catch (error) {
        console.error('❌ Error processing local file:', error);
        throw new Error('Failed to process local receipt file');
      }
    }
    
    const { data, error } = await supabase.functions.invoke('process-receipt', {
      body: JSON.stringify(requestBody)
    });
    
    if (error) {
      console.error('❌ Error from Edge Function:', error);
      handleOcrError({ type: 'SERVER_ERROR', error: error.message });
      return {
        confidence: 0.1,
        error: error.message,
        type: 'SERVER_ERROR'
      };
    }
    
    if (!data) {
      console.error('❌ No data returned from Edge Function');
      handleOcrError({ type: 'SERVER_ERROR', error: "We couldn't process your receipt" });
      return {
        confidence: 0.1,
        error: "We couldn't process your receipt",
        type: 'SERVER_ERROR'
      };
    }
    
    if (data.type === 'FETCH_ERROR') {
      console.error('❌ Edge Function returned error:', data);
      handleOcrError(data);
      return {
        confidence: 0.1,
        error: data.message,
        type: data.type
      };
    }
    
    if (data.error) {
      console.error('❌ Edge Function returned error:', data);
      handleOcrError(data);
      return {
        confidence: data.confidence || 0.1,
        error: data.error,
        type: data.type || 'SERVER_ERROR',
        ...data.data
      };
    }
    
    return mapOcrResponseToFormData(data);
  } catch (error) {
    console.error('❌ Unexpected error in processReceiptWithEdgeFunction:', error);
    
    toast("Something unexpected happened", {
      description: "You can still enter the expense details manually."
    });
    
    return {
      confidence: 0.1,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      type: 'SERVER_ERROR'
    };
  }
}

function handleOcrError(data: { type: string; error: string; message?: string }) {
  const description = data.message || "You can still enter the details manually.";
  
  switch(data.type) {
    case 'FETCH_ERROR':
      toast("We're having trouble accessing this image", {
        description: "Could you try uploading it again?"
      });
      break;
    case 'SERVER_ERROR':
      toast("We're experiencing technical difficulties", {
        description: "Please try again in a moment."
      });
      break;
    case 'OCR_CONFIDENCE_LOW':
      toast("The text is a bit hard to read", {
        description: "Feel free to adjust any details that don't look right."
      });
      break;
    case 'IMAGE_FORMAT_ERROR':
      toast("This image format isn't supported", {
        description: "Please upload a JPEG or PNG file."
      });
      break;
    default:
      toast("Something went wrong while processing your receipt", {
        description
      });
  }
}

function mapOcrResponseToFormData(ocrResponse: MindeeResponse | any): OCRResult {
  if (import.meta.env.DEV) {
    console.log('OCR Debug:', { 
      confidence: (ocrResponse as any)?.confidence,
      response: ocrResponse 
    });
  }

  // Normalize amount
  const extractAmount = (): string => {
    const anyResp: any = ocrResponse;
    if (!anyResp) return '';
    if (typeof anyResp.amount === 'number') return anyResp.amount.toString();
    if (typeof anyResp.amount === 'string') return anyResp.amount;
    if (anyResp.amount?.value) return String(anyResp.amount.value);
    if (anyResp.total?.amount) return String(anyResp.total.amount);
    return '';
  };

  // Normalize date
  const extractDate = (): Date | undefined => {
    const anyResp: any = ocrResponse;
    if (anyResp?.date instanceof Date) return anyResp.date;
    if (typeof anyResp?.date === 'string') {
      const parsed = new Date(anyResp.date);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    if (anyResp?.date?.value) {
      const parsed = new Date(anyResp.date.value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  };

  const supplierName = (ocrResponse as any)?.supplier?.value;
  const storeName = (ocrResponse as any)?.storeDetails?.name;
  const place = (ocrResponse as any)?.place || storeName || supplierName || '';

  const processedDate = extractDate();
  const amountStr = extractAmount();

  return {
    amount: amountStr,
    date: processedDate,
    description: storeName || supplierName || 'Purchase',
    place,
    confidence: (ocrResponse as any)?.confidence || (ocrResponse as any)?.confidence_summary?.overall || 0.5,
    
    lineItems: (ocrResponse as any)?.lineItems,
    tax: (ocrResponse as any)?.tax,
    total: (ocrResponse as any)?.total,
    subtotal: (ocrResponse as any)?.subtotal,
    discount: (ocrResponse as any)?.discount,
    paymentMethod: (ocrResponse as any)?.paymentMethod,
    storeDetails: (ocrResponse as any)?.storeDetails,
    receiptNumber: (ocrResponse as any)?.receiptNumber,
    transactionTime: (ocrResponse as any)?.transactionTime,
    currency: (ocrResponse as any)?.currency,
    confidence_summary: (ocrResponse as any)?.confidence_summary
      ? {
          overall: (ocrResponse as any).confidence_summary.overall,
          line_items: (ocrResponse as any).confidence_summary.line_items,
          total: (ocrResponse as any).confidence_summary.total,
          date: (ocrResponse as any).confidence_summary.date,
          merchant: (ocrResponse as any).confidence_summary.merchant
        }
      : undefined,
  };
}

export function validateOCRResult(result: OCRResult): boolean {
  console.log('🎯 Validating OCR result:', {
    confidence: result.confidence,
    hasAmount: !!result.amount,
    hasDate: !!result.date,
    hasLineItems: result.lineItems?.length || 0,
    hasStoreDetails: !!result.storeDetails,
    confidenceSummary: result.confidence_summary
  });
  
  // Enhanced validation that takes into account more than just overall confidence
  if (!result.confidence) {
    console.log('❌ Validation failed: No confidence score');
    return false;
  }
  
  // Check for minimum viable data
  const hasBasicData = Boolean(result.amount && result.date);
  
  // If we have confidence summary, use it for more granular validation
  if (result.confidence_summary) {
    const summary = result.confidence_summary;
    // Check if critical fields have reasonable confidence
    if (summary.total > 0.6 && summary.date > 0.5) {
      console.log('✅ Validation passed: Good total and date confidence');
      return true;
    }
    // If line items have good confidence, allow the result even if other fields are weaker
    if (summary.line_items > 0.7 && hasBasicData) {
      console.log('✅ Validation passed: Good line items confidence');
      return true;
    }
    // For demo mode, be more lenient - if we have line items at all, show them
    if (summary.line_items > 0.3 && result.lineItems && result.lineItems.length > 0) {
      console.log('✅ Validation passed: Demo mode - lenient line items check');
      return true;
    }
  }
  
  // Be more lenient for demo mode - if we have structured data, allow it
  if (result.lineItems && result.lineItems.length > 0) {
    console.log('✅ Validation passed: Demo mode - has line items');
    return true;
  }
  
  if (result.storeDetails || result.total || result.tax) {
    console.log('✅ Validation passed: Demo mode - has structured data');
    return true;
  }
  
  // Fall back to overall confidence check
  const isValid = result.confidence > 0.2 && hasBasicData; // Lowered threshold for demo
  console.log(isValid ? '✅ Validation passed: Basic confidence check' : '❌ Validation failed: Low confidence and missing basic data');
  return isValid;
}

// Fix: Update the saveReceiptDetailsAndLineItems function
export async function saveReceiptDetailsAndLineItems(
  expenseId: string, 
  ocrResult: OCRResult
): Promise<{ receiptDetail: ReceiptDetail | null; lineItems: ReceiptLineItem[] | null }> {
  try {
    // First, save the receipt details
    const receiptDetail: ReceiptDetail = {
      expenseId: expenseId,
      rawData: ocrResult,
      vendorName: ocrResult.storeDetails?.name || ocrResult.place,
      vendorAddress: ocrResult.storeDetails?.address,
      vendorPhone: ocrResult.storeDetails?.phone,
      vendorWebsite: ocrResult.storeDetails?.website,
      receiptNumber: ocrResult.receiptNumber?.value,
      transactionTime: ocrResult.transactionTime?.value instanceof Date 
        ? ocrResult.transactionTime.value.toISOString() 
        : typeof ocrResult.transactionTime?.value === 'string' 
        ? ocrResult.transactionTime.value 
        : undefined,
      subtotal: ocrResult.subtotal?.amount ? parseFloat(ocrResult.subtotal.amount) : undefined,
      taxAmount: ocrResult.tax?.amount ? parseFloat(ocrResult.tax.amount) : undefined,
      paymentMethod: ocrResult.paymentMethod?.type,
      currency: ocrResult.currency,
      confidenceSummary: ocrResult.confidence_summary ? {
        overall: ocrResult.confidence_summary.overall,
        lineItems: ocrResult.confidence_summary.line_items,
        total: ocrResult.confidence_summary.total,
        date: ocrResult.confidence_summary.date,
        merchant: ocrResult.confidence_summary.merchant
      } : undefined
    };
    
    // Insert receipt details into database
    const { data: detailData, error: detailError } = await supabase
      .from('receipt_details')
      .insert([{
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
        payment_method: receiptDetail.paymentMethod,
        currency: receiptDetail.currency,
        confidence_summary: receiptDetail.confidenceSummary
      }])
      .select()
      .single();
    
    if (detailError) {
      console.error('Error saving receipt details:', detailError);
      return { receiptDetail: null, lineItems: null };
    }
    
    // Now save line items if they exist
    if (ocrResult.lineItems && ocrResult.lineItems.length > 0) {
      const lineItemsToInsert = ocrResult.lineItems.map((item: OCRReceiptLineItem) => ({
        expense_id: expenseId,
        description: item.description,
        quantity: item.quantity ?? 1,
        unit_price: item.unitPrice ?? undefined,
        total_price: parseFloat(item.totalPrice || '0'),
        category_id: (item as any).categoryId ?? item.suggestedCategoryId ?? null,
        suggested_category_id: item.suggestedCategoryId ?? null,
        category_confidence: item.categoryConfidence ?? null,
        sku: item.sku ?? null,
        discount: (item as any).discount ?? (item as any).discounted ?? null
      }));
      
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('receipt_line_items')
        .insert(lineItemsToInsert)
        .select(`
          *,
          category:category_id(id, name, color),
          suggestedCategory:suggested_category_id(id, name, color)
        `);
      
      if (lineItemsError) {
        console.error('Error saving line items:', lineItemsError);
        return { 
          receiptDetail: {
            ...receiptDetail,
            id: detailData.id,
            createdAt: detailData.created_at
          }, 
          lineItems: null 
        };
      }
      
      // Fix: Correctly type the mapped items with proper null handling
      const mappedLineItems: ReceiptLineItem[] = lineItemsData.map(item => {
        // Process category and suggestedCategory properly
        let category: CategoryWithCamelCase | null = null;
        if (item.category && typeof item.category === 'object' && item.category !== null) {
          // Type narrowing with explicit checks and casting 
          const typedCategory = item.category as { id: string; name: string; color: string };
          if ('id' in typedCategory && 'name' in typedCategory && 'color' in typedCategory) {
            category = {
              id: typedCategory.id,
              name: typedCategory.name,
              color: typedCategory.color
            };
          }
        }
        
        let suggestedCategory: CategoryWithCamelCase | null = null;
        if (item.suggestedCategory && typeof item.suggestedCategory === 'object' && item.suggestedCategory !== null) {
          // Type narrowing with explicit checks and casting
          const typedSuggestedCategory = item.suggestedCategory as { id: string; name: string; color: string };
          if ('id' in typedSuggestedCategory && 'name' in typedSuggestedCategory && 'color' in typedSuggestedCategory) {
            suggestedCategory = {
              id: typedSuggestedCategory.id,
              name: typedSuggestedCategory.name,
              color: typedSuggestedCategory.color
            };
          }
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
      
      return { 
        receiptDetail: {
          ...receiptDetail,
          id: detailData.id,
          createdAt: detailData.created_at
        }, 
        lineItems: mappedLineItems 
      };
    }
    
    return { 
      receiptDetail: {
        ...receiptDetail,
        id: detailData.id,
        createdAt: detailData.created_at
      }, 
      lineItems: [] 
    };
    
  } catch (error) {
    console.error('Error saving receipt data:', error);
    return { receiptDetail: null, lineItems: null };
  }
}
