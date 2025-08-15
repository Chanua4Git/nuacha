export interface DateValidationResult {
  isValid: boolean;
  correctedDate?: Date;
  confidence: number;
  fallbackUsed: boolean;
  issues: string[];
}

export function validateAndCorrectOCRDate(
  dateInput: Date | string | undefined,
  imageMetadata?: { fileName?: string; timestamp?: number }
): DateValidationResult {
  const issues: string[] = [];
  let confidence = 1.0;
  let fallbackUsed = false;

  // Handle undefined or null dates
  if (!dateInput) {
    console.log('📅 No date provided, using fallback');
    const fallbackDate = imageMetadata?.timestamp 
      ? new Date(imageMetadata.timestamp) 
      : new Date();
    
    return {
      isValid: true,
      correctedDate: fallbackDate,
      confidence: 0.3,
      fallbackUsed: true,
      issues: ['No date detected in receipt, using current date']
    };
  }

  // Convert to Date object if it's a string
  let workingDate: Date;
  if (typeof dateInput === 'string') {
    workingDate = new Date(dateInput);
  } else {
    workingDate = new Date(dateInput);
  }

  // Check if date is valid
  if (isNaN(workingDate.getTime())) {
    console.log('📅 Invalid date detected, using fallback');
    const fallbackDate = imageMetadata?.timestamp 
      ? new Date(imageMetadata.timestamp) 
      : new Date();
    
    return {
      isValid: true,
      correctedDate: fallbackDate,
      confidence: 0.2,
      fallbackUsed: true,
      issues: ['Invalid date format detected, using current date']
    };
  }

  // Validate date is reasonable (not too far in past or future)
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  if (workingDate < fiveYearsAgo) {
    issues.push('Date seems too old (more than 5 years ago)');
    confidence -= 0.3;
  }

  if (workingDate > oneMonthFromNow) {
    issues.push('Date is in the future');
    confidence -= 0.4;
  }

  // Check if date is close to image timestamp if available
  if (imageMetadata?.timestamp) {
    const imageDate = new Date(imageMetadata.timestamp);
    const daysDifference = Math.abs(workingDate.getTime() - imageDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDifference > 30) {
      issues.push('Date differs significantly from when image was taken');
      confidence -= 0.2;
    }
  }

  // Normalize confidence to reasonable bounds
  confidence = Math.max(0.1, Math.min(1.0, confidence));

  console.log(`📅 Date validation result: ${workingDate.toISOString()}, confidence: ${confidence}, issues: ${issues.length}`);

  return {
    isValid: true,
    correctedDate: workingDate,
    confidence,
    fallbackUsed,
    issues
  };
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}