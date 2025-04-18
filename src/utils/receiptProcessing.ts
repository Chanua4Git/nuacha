
import { OCRResult } from '@/types/expense';

export async function processReceiptImage(file: File): Promise<OCRResult> {
  // This is a placeholder that will be replaced with Supabase Edge Function call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate processing delay
      const mockData: OCRResult = {
        amount: (Math.random() * 100 + 10).toFixed(2),
        description: 'Purchase',
        place: 'Store',
        date: new Date(),
        confidence: 0.85
      };
      resolve(mockData);
    }, 1500);
  });
}

export function validateOCRResult(result: OCRResult): boolean {
  return result.confidence !== undefined && result.confidence > 0.7;
}
