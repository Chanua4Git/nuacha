import { toast } from 'sonner';

/**
 * Debug helper to test Mindee API connectivity
 */
export async function testMindeeConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Mindee API connection...');
    
    // Create a small test image blob
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText('Test', 30, 50);
    }
    
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('❌ Failed to create test image');
          resolve(false);
          return;
        }
        
        try {
          const formData = new FormData();
          formData.append('receiptBase64', await blobToBase64(blob));
          formData.append('contentType', 'image/jpeg');
          
          const response = await fetch('/api/process-receipt', {
            method: 'POST',
            body: JSON.stringify({
              receiptBase64: await blobToBase64(blob),
              contentType: 'image/jpeg'
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          const result = await response.json();
          
          if (result.error && result.error.includes('Authentication failed')) {
            console.error('❌ Mindee API authentication failed');
            toast.error('API Connection Test Failed', {
              description: 'Authentication issue detected'
            });
            resolve(false);
          } else {
            console.log('✅ Mindee API connection test completed');
            toast.success('API Connection Test Passed', {
              description: 'Receipt processing service is working'
            });
            resolve(true);
          }
        } catch (error) {
          console.error('❌ API connection test failed:', error);
          toast.error('API Connection Test Failed', {
            description: 'Network or service error'
          });
          resolve(false);
        }
      }, 'image/jpeg', 0.8);
    });
  } catch (error) {
    console.error('❌ Failed to create test:', error);
    return false;
  }
}

/**
 * Convert blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Log detailed receipt processing information for debugging
 */
export function logReceiptProcessingDetails(
  file: File,
  processedFile: File,
  result: any,
  processingTime: number
) {
  console.group('📊 Receipt Processing Summary');
  console.log('Original file:', {
    name: file.name,
    size: `${Math.round(file.size / 1024)}KB`,
    type: file.type
  });
  console.log('Processed file:', {
    name: processedFile.name,
    size: `${Math.round(processedFile.size / 1024)}KB`,
    type: processedFile.type
  });
  console.log('Processing time:', `${processingTime}ms`);
  console.log('OCR Result:', {
    confidence: result.confidence,
    hasAmount: !!result.amount,
    hasDate: !!result.date,
    hasPlace: !!result.place,
    lineItemsCount: result.lineItems?.length || 0,
    error: result.error
  });
  console.groupEnd();
}

/**
 * Enhanced error reporting with context
 */
export function reportProcessingError(
  error: any,
  context: {
    fileName: string;
    fileSize: number;
    fileType: string;
    step: string;
  }
) {
  console.group('🚨 Receipt Processing Error');
  console.error('Error:', error);
  console.log('Context:', context);
  console.log('User Agent:', navigator.userAgent);
  console.log('Timestamp:', new Date().toISOString());
  
  // Log memory usage if available
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory:', {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
    });
  }
  
  console.groupEnd();
}