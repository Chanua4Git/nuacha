
import { OCRResult } from '@/types/expense';
import { supabaseClient } from '@/auth/utils/supabaseClient';
import { toast } from 'sonner';

/**
 * Uploads a receipt image to Supabase storage
 */
export async function uploadReceiptToStorage(file: File, userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabaseClient.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading receipt:', error);
      toast.error("We couldn't save your receipt", {
        description: "There was a problem uploading the image. Please try again."
      });
      return null;
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient.storage
      .from('receipts')
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in receipt upload:', error);
    toast.error("Something went wrong", {
      description: "We encountered an unexpected error while processing your receipt."
    });
    return null;
  }
}

/**
 * Processes a receipt image using Supabase Edge Function and Mindee API
 */
export async function processReceiptImage(file: File): Promise<OCRResult> {
  try {
    // First, check if user is authenticated
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    
    // Upload the receipt to Supabase storage
    const receiptUrl = await uploadReceiptToStorage(file, session.user.id);
    if (!receiptUrl) {
      return {
        confidence: 0.1,
        error: 'Failed to upload receipt'
      };
    }
    
    // Call the Supabase Edge Function to process the receipt
    return await processReceiptWithEdgeFunction(receiptUrl);
  } catch (error) {
    console.error('Error in processReceiptImage:', error);
    
    // Provide more detailed error feedback
    toast.error("Receipt processing failed", {
      description: "We couldn't extract details from your receipt. Please try again or enter details manually."
    });
    
    // Return a minimal result with low confidence to indicate failure
    return {
      confidence: 0.1,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Calls the Supabase Edge Function for OCR processing
 */
export async function processReceiptWithEdgeFunction(receiptUrl: string): Promise<OCRResult> {
  try {
    const { data, error } = await supabaseClient.functions.invoke('process-receipt', {
      body: { receiptUrl }
    });
    
    if (error) {
      console.error('Error from Edge Function:', error);
      toast.error("Receipt processing error", {
        description: "The receipt couldn't be processed. Please try again."
      });
      throw error;
    }
    
    return mapOcrResponseToFormData(data);
  } catch (error) {
    console.error('Error processing receipt with edge function:', error);
    
    toast.error("Processing didn't work", {
      description: "We couldn't read the receipt details. You can enter them manually."
    });
    
    throw error;
  }
}

/**
 * Maps the raw OCR response to our application's format
 */
function mapOcrResponseToFormData(ocrResponse: any): OCRResult {
  // This will map the Mindee API response to our application's format
  return {
    amount: ocrResponse.amount?.value || '',
    date: ocrResponse.date?.value ? new Date(ocrResponse.date.value) : undefined,
    description: ocrResponse.line_items?.length > 0 
      ? ocrResponse.line_items[0].description 
      : 'Purchase',
    place: ocrResponse.supplier?.value || ocrResponse.merchant_name?.value || '',
    confidence: ocrResponse.confidence || 0.5
  };
}

/**
 * Validates that the OCR result has sufficient confidence to be used
 */
export function validateOCRResult(result: OCRResult): boolean {
  // Lower the confidence threshold to be more lenient
  return result.confidence !== undefined && result.confidence > 0.3;
}
