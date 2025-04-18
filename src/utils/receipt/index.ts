
import { OCRResult } from '@/types/expense';
import { uploadReceiptToStorage } from './imageProcessing';
import { processReceiptWithEdgeFunction, validateOCRResult } from './ocrProcessing';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export async function processReceiptImage(file: File): Promise<OCRResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Please sign in to upload receipts');
    }
    
    const receiptUrl = await uploadReceiptToStorage(file, session.user.id);
    if (!receiptUrl) {
      return {
        confidence: 0.1,
        error: "We couldn't save your receipt — let's try adding it manually instead"
      };
    }
    
    console.log('📄 Processing receipt:', receiptUrl);
    
    try {
      const result = await processReceiptWithEdgeFunction(receiptUrl);
      console.log('✅ Receipt processed:', result);
      return result;
    } catch (error) {
      console.error('Error processing receipt with edge function:', error);
      
      let errorMessage = "The image might not be clear enough for us to read.";
      if (error instanceof Error) {
        if (error.message.includes('format')) {
          errorMessage = error.message;
        } else if (error.message.includes('fetch image')) {
          errorMessage = "We're having trouble reading this image. Would you like to try another one?";
        }
      }
      
      toast("We couldn't process your receipt", {
        description: errorMessage + " Feel free to enter the details manually."
      });
      
      return {
        confidence: 0.1,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('Error in processReceiptImage:', error);
    
    toast("We couldn't read the receipt details", {
      description: "You can still add the information manually when you're ready."
    });
    
    return {
      confidence: 0.1,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export { validateOCRResult };
