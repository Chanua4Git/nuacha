/**
 * Enhanced date validation for OCR results
 * Prioritizes DD/MM/YYYY format (T&T standard) over MM/DD/YYYY (US format)
 */

export interface DateCorrectionResult {
  correctedDate: string;
  confidence: number;
  wasCorrected: boolean;
  issues: string[];
}

/**
 * Converts DD/MM/YYYY format to YYYY-MM-DD for consistent parsing
 * T&T uses DD/MM/YYYY format, so we prioritize this interpretation
 */
function convertToISODate(dateString: string): { isoDate: string; wasConverted: boolean; issue?: string } {
  // SAFETY CHECK: Skip if already in ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.log('📅 Date already in ISO format, skipping conversion:', dateString);
    return { isoDate: dateString, wasConverted: false };
  }
  
  // SAFETY CHECK: Skip if contains letters (human-readable format like "Dec 7, 2025")
  if (/[a-zA-Z]/.test(dateString)) {
    console.log('📅 Date in text format, skipping conversion:', dateString);
    return { isoDate: dateString, wasConverted: false };
  }
  
  // Match patterns like DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const ddmmPattern = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/;
  const match = dateString.match(ddmmPattern);
  
  if (match) {
    const [, first, second, year] = match;
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);
    
    let day: number, month: number;
    let issue: string | undefined;
    
    // If first number > 12, it MUST be a day (DD/MM format)
    if (firstNum > 12 && secondNum <= 12) {
      day = firstNum;
      month = secondNum;
      issue = 'Detected DD/MM format (day > 12)';
    }
    // If second number > 12, it MUST be a day - this is MM/DD format
    else if (secondNum > 12 && firstNum <= 12) {
      month = firstNum;
      day = secondNum;
      issue = 'Detected MM/DD format (second value > 12)';
    }
    // AMBIGUOUS CASE: Both numbers are ≤ 12
    // T&T uses DD/MM/YYYY, so assume DD/MM format
    else {
      day = firstNum;
      month = secondNum;
      issue = 'Ambiguous date - assuming T&T DD/MM format';
    }
    
    // Validate the parsed values
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { isoDate: dateString, wasConverted: false, issue: 'Invalid day/month values' };
    }
    
    // Return ISO format YYYY-MM-DD for consistent parsing
    const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    console.log('📅 Date conversion:', { original: dateString, iso: isoDate, interpretation: issue });
    return { isoDate, wasConverted: true, issue };
  }
  
  // Already in ISO format or unrecognized
  return { isoDate: dateString, wasConverted: false };
}

export function validateAndCorrectOcrDate(dateString: string): DateCorrectionResult {
  const issues: string[] = [];
  let correctedDate = dateString;
  let wasCorrected = false;
  let confidence = 0.8;

  console.log('🔍 Validating OCR date:', dateString);

  // Step 1: Apply common OCR character corrections
  const charCorrections = [
    { pattern: /[oO]/g, replacement: '0', description: 'O->0' },
    { pattern: /[lI]/g, replacement: '1', description: 'l/I->1' },
  ];

  charCorrections.forEach(correction => {
    const before = correctedDate;
    correctedDate = correctedDate.replace(correction.pattern, correction.replacement);
    if (before !== correctedDate) {
      wasCorrected = true;
      issues.push(`Applied ${correction.description}`);
    }
  });

  // Step 2: Normalize separators
  const beforeNormalize = correctedDate;
  correctedDate = correctedDate.replace(/(\d{1,2})[\s\-_.]+(\d{1,2})[\s\-_.]+(\d{2,4})/g, '$1/$2/$3');
  if (beforeNormalize !== correctedDate) {
    wasCorrected = true;
    issues.push('Normalized date separators');
  }

  // Step 3: Add century to 2-digit years
  const beforeCentury = correctedDate;
  correctedDate = correctedDate.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, '$1/$2/20$3');
  if (beforeCentury !== correctedDate) {
    wasCorrected = true;
    issues.push('Added century to year');
  }

  // Step 4: Convert DD/MM/YYYY to ISO format (prioritizing T&T format)
  const conversion = convertToISODate(correctedDate);
  if (conversion.wasConverted) {
    correctedDate = conversion.isoDate;
    wasCorrected = true;
    if (conversion.issue) {
      issues.push(conversion.issue);
    }
  }

  // Validate date reasonableness
  const parsedDate = new Date(correctedDate);
  if (isNaN(parsedDate.getTime())) {
    confidence = 0.1;
    issues.push('Could not parse as valid date');
    return {
      correctedDate: dateString, // Return original if we can't parse
      confidence,
      wasCorrected,
      issues
    };
  }

  // Check if date is reasonable (not too far in past/future)
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneMonthAhead = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  if (parsedDate < oneYearAgo) {
    confidence *= 0.7;
    issues.push('Date is quite old');
  } else if (parsedDate > oneMonthAhead) {
    confidence *= 0.6;
    issues.push('Date is in the future - please verify');
  }

  if (wasCorrected) {
    console.log('🔧 Date corrected:', { original: dateString, corrected: correctedDate, issues });
  }

  return {
    correctedDate,
    confidence,
    wasCorrected,
    issues
  };
}