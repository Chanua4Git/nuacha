import { toast } from 'sonner';

/**
 * Enhanced date processing for OCR results
 */

export interface DateValidationResult {
  isValid: boolean;
  correctedDate?: Date;
  confidence: number;
  suggestions?: string[];
}

/**
 * Helper function to parse dates in local timezone
 */
function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date(NaN);
  // YYYY-MM-DD -> construct as local date (no timezone shift)
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoWithTZ = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  const m = dateString.match(ymd);
  if (m) {
    const [, year, month, day] = m;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  // If ISO string with explicit timezone (Z or +hh:mm), preserve calendar day
  if (isoWithTZ.test(dateString)) {
    const d = new Date(dateString);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  // Fallback to native parsing (may be local time)
  return new Date(dateString);
}

/**
 * Validates and corrects OCR-extracted dates
 */
export function validateAndCorrectDate(
  ocrDateString: string | undefined,
  imageMetadata?: { fileName?: string; timestamp?: number }
): DateValidationResult {
  if (!ocrDateString) {
    return {
      isValid: false,
      confidence: 0,
      suggestions: ['No date detected - please select manually']
    };
  }

  console.log('📅 Validating OCR date:', ocrDateString);

  // Parse date in local timezone to avoid UTC conversion issues
  let parsedDate = parseLocalDate(ocrDateString);
  let confidence = 0.5;
  const suggestions: string[] = [];

  // Check if the parsed date is valid
  if (isNaN(parsedDate.getTime())) {
    // Try common OCR mistake patterns
    const correctedDateString = correctCommonOcrMistakes(ocrDateString);
    parsedDate = parseLocalDate(correctedDateString);
    
    if (!isNaN(parsedDate.getTime())) {
      suggestions.push(`Corrected "${ocrDateString}" to "${correctedDateString}"`);
      confidence = 0.7;
    } else {
      return {
        isValid: false,
        confidence: 0,
        suggestions: [`Could not parse date "${ocrDateString}" - please select manually`]
      };
    }
  }

  // Validate date reasonableness
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneMonthAhead = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Check if date is in reasonable range (not too far in past/future)
  if (parsedDate < oneYearAgo) {
    suggestions.push('Date seems quite old - please verify');
    confidence = Math.max(0.3, confidence - 0.2);
  } else if (parsedDate > oneMonthAhead) {
    suggestions.push('Date is in the future - please verify');
    confidence = Math.max(0.3, confidence - 0.2);
  } else {
    confidence = Math.min(0.9, confidence + 0.2);
  }

  // Cross-check with file metadata if available
  if (imageMetadata?.timestamp) {
    const fileDate = new Date(imageMetadata.timestamp);
    const daysDifference = Math.abs((parsedDate.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 30) {
      suggestions.push('Date differs significantly from when photo was taken');
      confidence = Math.max(0.4, confidence - 0.1);
    }
  }

  return {
    isValid: confidence > 0.3,
    correctedDate: parsedDate,
    confidence,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

/**
 * Converts DD/MM/YYYY format to MM/DD/YYYY for JavaScript Date parsing
 * T&T uses DD/MM/YYYY format, so we prioritize this interpretation
 */
function convertDDMMToMMDD(dateString: string): string {
  // Match patterns like DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const ddmmPattern = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/;
  const match = dateString.match(ddmmPattern);
  
  if (match) {
    const [, first, second, year] = match;
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);
    
    // If first number > 12, it MUST be a day (DD/MM format)
    if (firstNum > 12 && secondNum <= 12) {
      console.log('📅 Detected DD/MM format (first > 12):', dateString);
      return `${second}/${first}/${year}`;
    }
    
    // If second number > 12, it MUST be a day (MM/DD format already)
    if (secondNum > 12 && firstNum <= 12) {
      console.log('📅 Detected MM/DD format (second > 12):', dateString);
      return `${first}/${second}/${year}`;
    }
    
    // AMBIGUOUS CASE: Both numbers are ≤ 12
    // T&T uses DD/MM/YYYY, so assume DD/MM format
    // Swap to MM/DD for JavaScript parsing
    console.log('📅 Ambiguous date, assuming T&T DD/MM format:', dateString);
    return `${second}/${first}/${year}`;
  }
  
  return dateString;
}

/**
 * Corrects common OCR mistakes in date strings
 */
function correctCommonOcrMistakes(dateString: string): string {
  let corrected = dateString;

  // Step 1: Fix common character misreads
  const charCorrections: [RegExp, string][] = [
    [/[oO]/g, '0'], // O -> 0 (but be careful not to replace valid Os)
    [/[lI]/g, '1'], // l,I -> 1
  ];

  charCorrections.forEach(([pattern, replacement]) => {
    corrected = corrected.replace(pattern, replacement);
  });

  // Step 2: Normalize separators to /
  corrected = corrected.replace(/(\d{1,2})[\s\-_.](\d{1,2})[\s\-_.](\d{2,4})/g, '$1/$2/$3');
  
  // Step 3: Add century to 2-digit years
  corrected = corrected.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, '$1/$2/20$3');
  
  // Step 4: Convert DD/MM/YYYY to MM/DD/YYYY for T&T format
  corrected = convertDDMMToMMDD(corrected);

  console.log('🔧 Date correction:', { original: dateString, corrected });
  return corrected;
}

/**
 * Format date for display in the UI
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Show date validation warnings to user
 */
export function showDateValidationWarning(validation: DateValidationResult) {
  if (!validation.isValid) {
    toast('Date needs attention', {
      description: validation.suggestions?.[0] || 'Please select the correct date manually'
    });
  } else if (validation.confidence < 0.7 && validation.suggestions?.length) {
    toast('Please verify the date', {
      description: validation.suggestions[0]
    });
  }
}