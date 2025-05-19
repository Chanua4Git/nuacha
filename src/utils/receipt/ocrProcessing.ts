
import { OCRResult, ReceiptLineItem as OCRReceiptLineItem } from '@/types/expense';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MindeeResponse } from './types';
import { ReceiptDetail, ReceiptLineItem } from '@/types/receipt';

export async function processReceiptWithEdgeFunction(receiptUrl: string): Promise<OCRResult> {
  try {
    console.log('📄 Processing receipt:', receiptUrl);
    
    // Check if this is a local file URL (for demo/unauthenticated users)
    const isLocalFileUrl = receiptUrl.startsWith('blob:');
    let requestBody: any = { receiptUrl };
    
    // For demo users (unauthenticated), we need to send the file directly
    if (isLocalFileUrl) {
      try {
        const response = await fetch(receiptUrl);
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Remove the data URL prefix
            const base64Content = base64data.split(',')[1];
            resolve(base64Content);
          };
        });
        reader.readAsDataURL(blob);
        
        const base64Content = await base64Promise;
        requestBody = { 
          receiptBase64: base64Content,
          contentType: blob.type,
          isDemo: true
        };
        
      } catch (error) {
        console.error('Error processing local file:', error);
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

function mapOcrResponseToFormData(ocrResponse: MindeeResponse): OCRResult {
  if (import.meta.env.DEV) {
    console.log('OCR Debug:', { 
      confidence: ocrResponse.confidence,
      response: ocrResponse 
    });
  }

  // Enhanced mapping to include all available data
  return {
    // Basic fields - prioritize values from the store details if available
    amount: ocrResponse.amount?.value || (ocrResponse.total?.amount) || '',
    date: ocrResponse.date?.value ? new Date(ocrResponse.date.value) : undefined,
    description: ocrResponse.storeDetails?.name || ocrResponse.supplier?.value || 
      (ocrResponse.lineItems && ocrResponse.lineItems.length > 0 ? ocrResponse.lineItems[0].description : 'Purchase'),
    place: ocrResponse.storeDetails?.address || ocrResponse.supplier?.value || '',
    confidence: ocrResponse.confidence || ocrResponse.confidence_summary?.overall || 0.5,
    
    // Enhanced fields
    lineItems: ocrResponse.lineItems,
    tax: ocrResponse.tax,
    total: ocrResponse.total,
    subtotal: ocrResponse.subtotal,
    discount: ocrResponse.discount,
    paymentMethod: ocrResponse.paymentMethod,
    storeDetails: ocrResponse.storeDetails,
    receiptNumber: ocrResponse.receiptNumber,
    transactionTime: ocrResponse.transactionTime,
    currency: ocrResponse.currency,
    confidence_summary: ocrResponse.confidence_summary ? {
      overall: ocrResponse.confidence_summary.overall,
      line_items: ocrResponse.confidence_summary.line_items,
      total: ocrResponse.confidence_summary.total,
      date: ocrResponse.confidence_summary.date,
      merchant: ocrResponse.confidence_summary.merchant
    } : undefined
  };
}

export function validateOCRResult(result: OCRResult): boolean {
  // Enhanced validation that takes into account more than just overall confidence
  if (!result.confidence) return false;
  
  // Check for minimum viable data
  const hasBasicData = Boolean(result.amount && result.date);
  
  // If we have confidence summary, use it for more granular validation
  if (result.confidence_summary) {
    const summary = result.confidence_summary;
    // Check if critical fields have reasonable confidence
    if (summary.total > 0.6 && summary.date > 0.5) {
      return true;
    }
    // If line items have good confidence, allow the result even if other fields are weaker
    if (summary.line_items > 0.7 && hasBasicData) {
      return true;
    }
  }
  
  // Fall back to overall confidence check
  return result.confidence > 0.3 && hasBasicData;
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
      transactionTime: ocrResult.transactionTime?.value.toISOString(),
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
        quantity: item.quantity,
        total_price: parseFloat(item.totalPrice),
        suggested_category_id: item.suggestedCategoryId,
        category_confidence: item.categoryConfidence,
        sku: item.sku,
        discount: item.discounted
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
      const mappedLineItems = lineItemsData.map(item => ({
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
        category: item.category || null,
        suggestedCategory: item.suggestedCategory || null,
        isEditing: false
      })) as ReceiptLineItem[];
      
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
