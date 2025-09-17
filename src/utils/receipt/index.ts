
import { OCRResult } from '@/types/expense';
import { handleReceiptUpload } from './uploadHandling';
import { handleOCRError, handleUnexpectedError } from './errorHandling';
import { validateOCRResult } from './validation';
import { processReceiptWithEdgeFunction } from './ocrProcessing';
import { preprocessReceiptImage, checkImageQuality } from './imagePreprocessing';
import { toast } from 'sonner';

export async function processReceiptImage(file: File, familyId?: string): Promise<OCRResult> {
  try {
    // Show processing toast to give feedback during OCR
    const loadingToast = toast.loading("Analyzing your receipt...", {
      description: "We're extracting the details with care."
    });

    // Step 1: Convert HEIC files to JPEG if needed
    console.log(`📸 Processing image: ${file.name} (${Math.round(file.size / 1024)}KB, ${file.type})`);
    let processedFile = file;
    
    // Handle HEIC conversion
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        console.log('🔄 Converting HEIC image to JPEG...');
        const { convertHeicToJpeg } = await import('./imageProcessing');
        processedFile = await convertHeicToJpeg(file);
        console.log(`✅ HEIC conversion complete: ${processedFile.name} (${Math.round(processedFile.size / 1024)}KB)`);
      } catch (heicError) {
        console.error('❌ HEIC conversion failed:', heicError);
        toast.dismiss(loadingToast);
        toast.error("Couldn't convert HEIC image", {
          description: "Please convert to JPEG or PNG and try again."
        });
        return {
          confidence: 0.1,
          error: 'HEIC conversion failed',
          type: 'IMAGE_FORMAT_ERROR'
        };
      }
    }

    // Step 2: Check image quality and determine preprocessing needs
    const qualityCheck = await checkImageQuality(processedFile);
    console.log(`📐 Image quality analysis:`, qualityCheck);

    // Step 3: Preprocess image if recommended
    if (qualityCheck.recommendPreprocessing || qualityCheck.isLongReceipt) {
      try {
        console.log('🔧 Preprocessing image for better OCR...');
        processedFile = await preprocessReceiptImage(processedFile, {
          maxWidth: 1920,
          maxHeight: 1920, 
          quality: 0.9,
          enableEnhancement: true
        });
        console.log(`✅ Image preprocessing complete: ${Math.round(processedFile.size / 1024)}KB`);
      } catch (preprocessError) {
        console.warn('⚠️ Image preprocessing failed, using original:', preprocessError);
        // Continue with original file if preprocessing fails
      }
    }
    
    // Step 4: Upload the processed file
    const receiptUrl = await handleReceiptUpload(processedFile);
    if (!receiptUrl) {
      toast.dismiss(loadingToast);
      return {
        confidence: 0.1,
        error: "We couldn't save your receipt — let's try adding it manually instead"
      };
    }
    
    // Step 5: Process with OCR
    try {
      const result = await processReceiptWithEdgeFunction(receiptUrl, familyId);
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
