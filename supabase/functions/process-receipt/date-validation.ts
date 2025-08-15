/**
 * Enhanced date validation for OCR results
 */

export interface DateCorrectionResult {
  correctedDate: string;
  confidence: number;
  wasCorrected: boolean;
  issues: string[];
}

export function validateAndCorrectOcrDate(dateString: string): DateCorrectionResult {
  const issues: string[] = [];
  let correctedDate = dateString;
  let wasCorrected = false;
  let confidence = 0.8;

  console.log('🔍 Validating OCR date:', dateString);

  // Apply common OCR corrections
  const corrections = [
    // Character misreads
    { pattern: /[oO]/g, replacement: '0', description: 'O->0' },
    { pattern: /[lI]/g, replacement: '1', description: 'l/I->1' },
    { pattern: /S/g, replacement: '5', description: 'S->5' },
    { pattern: /B/g, replacement: '8', description: 'B->8' },
    
    // Date format normalization
    { pattern: /(\d{1,2})[\s\-_.]+(\d{1,2})[\s\-_.]+(\d{2,4})/g, replacement: '$1/$2/$3', description: 'format normalization' },
    { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{2})$/, replacement: '$1/$2/20$3', description: 'add century' }
  ];

  corrections.forEach(correction => {
    const before = correctedDate;
    correctedDate = correctedDate.replace(correction.pattern, correction.replacement);
    if (before !== correctedDate) {
      wasCorrected = true;
      issues.push(`Applied ${correction.description}`);
    }
  });

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
  const sixMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

  if (parsedDate < oneYearAgo) {
    confidence *= 0.7;
    issues.push('Date is quite old');
  } else if (parsedDate > sixMonthsAhead) {
    confidence *= 0.6;
    issues.push('Date is in the future');
  }

  // Handle common DD/MM vs MM/DD confusion
  const dateParts = correctedDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateParts) {
    const [, part1, part2, year] = dateParts;
    const num1 = parseInt(part1);
    const num2 = parseInt(part2);
    
    // If first number > 12, assume it's DD/MM format and swap
    if (num1 > 12 && num2 <= 12) {
      correctedDate = `${part2}/${part1}/${year}`;
      wasCorrected = true;
      issues.push('Swapped day/month positions');
      confidence *= 0.9;
    }
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