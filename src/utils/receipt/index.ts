
import { OCRResult } from '@/types/expense';
import { handleReceiptUpload } from './uploadHandling';
import { handleOCRError, handleUnexpectedError } from './errorHandling';
import { validateOCRResult } from './ocrProcessing';
import { processReceiptWithEdgeFunction } from './ocrProcessing';
import { toast } from 'sonner';

export async function processReceiptImage(file: File): Promise<OCRResult> {
  try {
    toast("Processing your receipt...", {
      description: "We're extracting the information for you."
    });
    
    const receiptUrl = await handleReceiptUpload(file);
    if (!receiptUrl) {
      return {
        confidence: 0.1,
        error: "We couldn't save your receipt — let's try adding it manually instead"
      };
    }
    
    try {
      const result = await processReceiptWithEdgeFunction(receiptUrl);
      console.log('✅ Receipt processed:', result);
      
      // Even if validation fails, return the data for manual correction
      if (!validateOCRResult(result) && !result.error) {
        toast("We extracted some details, but they might need adjusting", {
          description: "Feel free to make changes before saving."
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error processing receipt with edge function:', error);
      
      if (error instanceof Error) {
        return handleOCRError({
          type: error.message.includes('format') ? 'IMAGE_FORMAT_ERROR' : 'FETCH_ERROR',
          error: error.message,
          message: error.message.includes('format') ? undefined : 
            "We're having trouble reading this image. Would you like to try another one?"
        });
      }
      
      return handleUnexpectedError(error);
    }
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export { validateOCRResult };
