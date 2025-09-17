
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
      toast.error("We're having trouble accessing this image", {
        description: "Could you try uploading it again?"
      });
      break;
    case 'SERVER_ERROR':
      toast.error("We're experiencing technical difficulties", {
        description: "Please try again in a moment."
      });
      break;
    case 'OCR_CONFIDENCE_LOW':
      toast("The text is a bit hard to read", {
        description: "Feel free to adjust any details that don't look right."
      });
      break;
    case 'IMAGE_FORMAT_ERROR':
      toast.error("This image format isn't supported", {
        description: "Please upload a JPEG or PNG file."
      });
      break;
    default:
      // Check for specific error messages to provide better feedback
      if (error.error?.includes('Authentication failed') || error.error?.includes('Invalid API key')) {
        toast.error("We're having technical difficulties", {
          description: "Our image processing service is temporarily unavailable. Please try again later."
        });
      } else if (error.error?.includes('Payment required')) {
        toast.error("Service temporarily unavailable", {
          description: "Please try again in a few minutes."
        });
      } else if (error.error?.includes('Too many requests')) {
        toast.error("Too many requests", {
          description: "Please wait a moment and try again."
        });
      } else if (error.error?.includes('timeout')) {
        toast.error("Processing took too long", {
          description: "Please try with a smaller or clearer image."
        });
      } else {
        toast.error("Something went wrong while processing your receipt", {
          description
        });
      }
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
