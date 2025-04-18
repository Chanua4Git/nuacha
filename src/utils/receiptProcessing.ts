
import { OCRResult } from '@/types/expense';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import heic2any from 'heic2any';

/**
 * Converts HEIC images to JPEG if needed
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    try {
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      
      // Handle both possible return types from heic2any (Blob or Blob[])
      const singleBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
      
      return new File([singleBlob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg'
      });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error('Unable to convert your image. Please try uploading a JPEG or PNG instead.');
    }
  }
  return file;
}

/**
 * Uploads a receipt image to Supabase storage
 */
export async function uploadReceiptToStorage(file: File, userId: string): Promise<string | null> {
  try {
    // Convert HEIC to JPEG if needed
    const processedFile = await convertHeicToJpeg(file);
    
    const fileExt = processedFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading receipt:', error);
      toast("We couldn't save your receipt", {
        description: "There was a problem uploading the image. Please try again with a different photo."
      });
      return null;
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);
    
    console.log('📸 Receipt uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in receipt upload:', error);
    toast("We couldn't save your receipt", {
      description: "There was a problem uploading the image. Please try again with a different photo."
    });
    return null;
  }
}

/**
 * Processes a receipt image using Supabase Edge Function and Mindee API
 */
export async function processReceiptImage(file: File): Promise<OCRResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
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
      
      // Provide a more user-friendly error message based on the error
      let errorMessage = "The image might be unclear or in an unsupported format.";
      if (error instanceof Error) {
        if (error.message.includes('format')) {
          errorMessage = error.message;
        } else if (error.message.includes('fetch image')) {
          errorMessage = "We couldn't read the image properly. The file might be corrupted.";
        }
      }
      
      toast("We couldn't process your receipt", {
        description: errorMessage + " You can still enter details manually."
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

/**
 * Calls the Supabase Edge Function for OCR processing
 */
export async function processReceiptWithEdgeFunction(receiptUrl: string): Promise<OCRResult> {
  try {
    // Add timestamp to help avoid caching issues
    const timestamp = new Date().getTime();
    const urlWithTimestamp = `${receiptUrl}?t=${timestamp}`;
    
    const { data, error } = await supabase.functions.invoke('process-receipt', {
      body: { receiptUrl: urlWithTimestamp }
    });
    
    if (error) {
      console.error('Error from Edge Function:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from receipt processing');
    }
    
    if (data.error) {
      throw new Error(data.error);
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
