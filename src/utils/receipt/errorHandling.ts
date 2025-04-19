
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';

interface OCRError {
  type: string;
  error: string;
  message?: string;
}

export function handleOCRError(error: OCRError): OCRResult {
  const description = error.message || "You can still enter the details manually.";
  
  switch(error.type) {
    case 'FETCH_ERROR':
      toast("We're having trouble accessing this image", {
        description: "Could you try uploading it again?"
      });
      break;
    case 'SERVER_ERROR':
      toast("We're experiencing technical difficulties", {
        description: "Please try again in a moment."
      });
      break;
    case 'OCR_CONFIDENCE_LOW':
      toast("The text is a bit hard to read", {
        description: "Feel free to adjust any details that don't look right."
      });
      break;
    case 'IMAGE_FORMAT_ERROR':
      toast("This image format isn't supported", {
        description: "Please upload a JPEG or PNG file."
      });
      break;
    default:
      toast("Something went wrong while processing your receipt", {
        description
      });
  }
  
  return {
    confidence: 0.1,
    error: error.error,
    type: error.type as OCRResult['type']
  };
}

export function handleUnexpectedError(error: unknown): OCRResult {
  console.error('❌ Unexpected error in receipt processing:', error);
  
  toast("Something unexpected happened", {
    description: "You can still enter the expense details manually."
  });
  
  return {
    confidence: 0.1,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
    type: 'SERVER_ERROR'
  };
}
