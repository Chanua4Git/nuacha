
import { uploadReceiptToStorage, processReceiptWithEdgeFunction } from './receiptProcessing';

/**
 * This function tests the complete OCR flow:
 * 1. Upload receipt to Supabase Storage
 * 2. Call Edge Function with the receipt URL
 * 3. Process OCR results
 * 
 * Note: This is for testing purposes only and should be removed in production
 */
export async function testOcrFlow(file: File, userId: string) {
  try {
    console.log('Step 1: Uploading receipt to Supabase Storage...');
    const receiptUrl = await uploadReceiptToStorage(file, userId);
    
    if (!receiptUrl) {
      throw new Error('Failed to upload receipt');
    }
    
    console.log('Receipt uploaded successfully:', receiptUrl);
    
    console.log('Step 2: Processing receipt with Edge Function...');
    const ocrResult = await processReceiptWithEdgeFunction(receiptUrl);
    
    console.log('OCR processing complete:', ocrResult);
    return ocrResult;
    
  } catch (error) {
    console.error('Error in OCR test flow:', error);
    throw error;
  }
}
