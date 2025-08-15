
import { OCRResult } from '@/types/expense';
import { handleReceiptUpload } from './uploadHandling';
import { handleOCRError, handleUnexpectedError } from './errorHandling';
import { validateOCRResult } from './validation';
import { processReceiptWithEdgeFunction } from './ocrProcessing';
import { preprocessReceiptImage, checkImageQuality } from './imagePreprocessing';
import { toast } from 'sonner';

export async function processReceiptImage(file: File): Promise<OCRResult> {
  try {
    // Show processing toast to give feedback during OCR
    const loadingToast = toast.loading("Analyzing your receipt...", {
      description: "We're extracting the details with care."
    });
    
    // Check image quality and preprocess if needed
    let processedFile = file;
    try {
      const imageAnalysis = await checkImageQuality(file);
      
      if (imageAnalysis.recommendPreprocessing) {
        console.log('🔄 Preprocessing image for better OCR...');
        processedFile = await preprocessReceiptImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.92,
          enableEnhancement: true
        });
      }
      
      if (imageAnalysis.isLongReceipt) {
        console.log('📏 Long receipt detected, using enhanced processing');
        toast.loading("Processing long receipt...", {
          description: "This might take a moment for better accuracy.",
          id: loadingToast
        });
      }
    } catch (preprocessError) {
      console.warn('⚠️ Image preprocessing failed, using original:', preprocessError);
      // Continue with original file
    }
    
    const receiptUrl = await handleReceiptUpload(processedFile);
    if (!receiptUrl) {
      toast.dismiss(loadingToast);
      return {
        confidence: 0.1,
        error: "We couldn't save your receipt — let's try adding it manually instead"
      };
    }
    
    try {
      const result = await processReceiptWithEdgeFunction(receiptUrl);
      toast.dismiss(loadingToast);
      
      const confidence = result.confidence || 0;
      if (confidence > 0.8) {
        toast.success("Receipt analyzed successfully", {
          description: "We've extracted all the details with high confidence."
        });
      } else if (confidence > 0.5) {
        toast("Receipt details extracted", {
          description: "Some details might need your review."
        });
      } else {
        toast("Receipt processed with low confidence", {
          description: "Please check and adjust the details as needed."
        });
      }
      
      console.log('✅ Receipt processed:', result);
      return result;
    } catch (error) {
      toast.dismiss(loadingToast);
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
