
import { OCRResult } from '@/types/expense';
import { supabase } from '@/lib/supabase';
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
      
      const singleBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
      
      return new File([singleBlob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg'
      });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error("This image format isn't supported yet. Would you like to try with a JPEG or PNG instead?");
    }
  }
  return file;
}

/**
 * Uploads a receipt image to Supabase storage
 */
export async function uploadReceiptToStorage(file: File, userId: string): Promise<string | null> {
  try {
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
      toast("We couldn't save your receipt right now", {
        description: "Let's try again in a moment, or you can add the details manually."
      });
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);
    
    console.log('📸 Receipt uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in receipt upload:', error);
    toast("We couldn't save your receipt", {
      description: "You can still enter the details manually when you're ready."
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

/**
 * Calls the Supabase Edge Function for OCR processing
 */
export async function processReceiptWithEdgeFunction(receiptUrl: string): Promise<OCRResult> {
  try {
    const timestamp = new Date().getTime();
    const urlWithTimestamp = `${receiptUrl}?t=${timestamp}`;
    
    const { data, error } = await supabase.functions.invoke('process-receipt', {
      body: JSON.stringify({ receiptUrl: urlWithTimestamp })
    });
    
    if (error) {
      console.error('Error from Edge Function:', error);
      
      toast("We couldn't process your receipt right now", {
        description: error.message || "Let's try again in a moment, or you can enter the details manually."
      });
      
      return {
        confidence: 0.1,
        error: error.message || 'Unknown error occurred'
      };
    }
    
    if (!data) {
      toast("The receipt processing didn't return any data", {
        description: "The image might not be clear enough for us to read. Feel free to enter the details manually."
      });
      
      return {
        confidence: 0.1,
        error: 'No data returned from receipt processing'
      };
    }
    
    if (data.error) {
      toast("We couldn't process your receipt", {
        description: data.error || "Let's try another image or enter the details manually."
      });
      
      return {
        confidence: 0.1,
        error: data.error
      };
    }
    
    return mapOcrResponseToFormData(data.prediction || {});
  } catch (error) {
    console.error('Unexpected error in processReceiptWithEdgeFunction:', error);
    
    toast("Something unexpected happened", {
      description: "You can still enter the expense details manually."
    });
    
    return {
      confidence: 0.1,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Maps the raw OCR response to our application's format
 */
function mapOcrResponseToFormData(ocrResponse: any): OCRResult {
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
  return result.confidence !== undefined && result.confidence > 0.3;
}
