
import { uploadReceiptToStorage } from './receipt/imageProcessing';
import { processReceiptWithEdgeFunction } from './receipt/ocrProcessing';
import { toast } from 'sonner';

/**
 * This function tests the complete OCR flow:
 * 1. Upload receipt to Supabase Storage
 * 2. Call Edge Function with the receipt URL
 * 3. Process OCR results
 * 
 * Note: This is for testing purposes only
 */
export async function testOcrFlow(file: File, userId: string) {
  try {
    console.log('🧪 Starting OCR test flow...');
    console.log('Step 1: Uploading receipt to Supabase Storage...');
    
    const receiptUrl = await uploadReceiptToStorage(file, userId);
    
    if (!receiptUrl) {
      console.error('❌ Failed to upload receipt to storage');
      toast.error("Couldn't upload the receipt");
      throw new Error('Failed to upload receipt');
    }
    
    console.log('✅ Receipt uploaded successfully:', receiptUrl);
    
    console.log('Step 2: Processing receipt with Edge Function...');
    const ocrResult = await processReceiptWithEdgeFunction(receiptUrl);
    
    if (ocrResult.error) {
      console.error('❌ OCR processing error:', ocrResult.error);
      toast.error("Couldn't process the receipt", {
        description: ocrResult.error
      });
      return ocrResult;
    }
    
    console.log('✅ OCR processing complete:', ocrResult);
    toast.success('Receipt processed successfully', {
      description: `Amount: ${ocrResult.amount || 'Not found'}, Place: ${ocrResult.place || 'Not found'}`
    });
    
    return ocrResult;
    
  } catch (error) {
    console.error('❌ Error in OCR test flow:', error);
    toast.error('Error testing receipt processing');
    throw error;
  }
}
