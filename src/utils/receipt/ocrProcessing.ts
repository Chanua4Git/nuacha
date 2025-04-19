
import { OCRResult } from '@/types/expense';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MindeeResponse } from './types';

export async function processReceiptWithEdgeFunction(receiptUrl: string): Promise<OCRResult> {
  try {
    console.log('📄 Processing receipt:', receiptUrl);
    
    const { data, error } = await supabase.functions.invoke('process-receipt', {
      body: JSON.stringify({ receiptUrl })
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
    confidence_summary: ocrResponse.confidence_summary
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
