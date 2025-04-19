
import { OCRResult } from '@/types/expense';

export function validateOCRResult(result: OCRResult): boolean {
  if (!result.confidence) return false;
  
  // Check for minimum viable data
  const hasBasicData = Boolean(result.amount && result.date);
  
  // Use confidence summary for more granular validation if available
  if (result.confidence_summary) {
    const summary = result.confidence_summary;
    
    // Check if critical fields have reasonable confidence
    if (summary.total > 0.6 && summary.date > 0.5) {
      return true;
    }
    
    // Allow high-confidence line items even if other fields are weaker
    if (summary.line_items > 0.7 && hasBasicData) {
      return true;
    }
  }
  
  // Fall back to overall confidence check
  return result.confidence > 0.3 && hasBasicData;
}
