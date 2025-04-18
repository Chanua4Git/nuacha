
import { OCRResult } from '@/types/expense';
import { supabase } from '@/lib/supabase';

/**
 * Uploads a receipt image to Supabase storage
 */
export async function uploadReceiptToStorage(file: File, userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading receipt:', error);
      return null;
    }
    
    // If we're using the mock client, generate a fake URL for development
    if (!data) {
      return URL.createObjectURL(file);
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in receipt upload:', error);
    return null;
  }
}

/**
 * Processes a receipt image using Supabase Edge Function and Mindee API
 */
export async function processReceiptImage(file: File): Promise<OCRResult> {
  // This is a temporary mock implementation
  // It will be replaced with actual Supabase Edge Function call once Supabase is connected
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate processing delay
      const mockData: OCRResult = {
        amount: (Math.random() * 100 + 10).toFixed(2),
        description: 'Purchase',
        place: 'Store',
        date: new Date(),
        confidence: 0.85
      };
      resolve(mockData);
    }, 1500);
  });
}

/**
 * Once Supabase is connected, this function will call the Edge Function for OCR
 */
export async function processReceiptWithEdgeFunction(receiptUrl: string): Promise<OCRResult> {
  try {
    const { data, error } = await supabase.functions.invoke('process-receipt', {
      body: { receiptUrl }
    });
    
    if (error) {
      console.error('Error from Edge Function:', error);
      throw error;
    }
    
    // If we're using the mock client, generate fake OCR data
    if (!data) {
      return {
        amount: (Math.random() * 100 + 10).toFixed(2),
        description: 'Sample Purchase',
        place: 'Sample Store',
        date: new Date(),
        confidence: 0.85
      };
    }
    
    return mapOcrResponseToFormData(data);
  } catch (error) {
    console.error('Error processing receipt with edge function:', error);
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
    description: ocrResponse.line_items?.length > 0 ? 
      ocrResponse.line_items[0].description : 'Purchase',
    place: ocrResponse.supplier?.value || ocrResponse.merchant_name?.value || '',
    confidence: ocrResponse.confidence || 0.5
  };
}

/**
 * Validates that the OCR result has sufficient confidence to be used
 */
export function validateOCRResult(result: OCRResult): boolean {
  return result.confidence !== undefined && result.confidence > 0.7;
}
