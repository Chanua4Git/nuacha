
import { MindeeOCRResult } from './types.ts';
import { processLineItems } from './line-items.ts';
import { validateAndCorrectOcrDate } from './date-validation.ts';

// Helper function to parse dates in local timezone
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

// Enhanced date validation with fallback handling
function validateAndCorrectDate(dateString: string | undefined, imageMetadata?: { fileName?: string; timestamp?: number }) {
  console.log('📅 Processing date from OCR:', dateString);
  
  if (!dateString) {
    console.log('⚠️ No date string provided, using current date as fallback');
    return {
      correctedDate: new Date(),
      confidence: 0.2,
      issues: ['No date detected in receipt']
    };
  }

  try {
    // Parse date in local timezone to avoid UTC conversion issues
    const parsedDate = parseLocalDate(dateString);
    
    if (isNaN(parsedDate.getTime())) {
      console.log('⚠️ Invalid date format, using current date as fallback');
      return {
        correctedDate: new Date(),
        confidence: 0.2,
        issues: ['Invalid date format detected']
      };
    }

    // Validate the date is reasonable
    const now = new Date();
    const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    let confidence = 0.8;
    const issues: string[] = [];

    if (parsedDate < fiveYearsAgo) {
      console.log('⚠️ Date seems too old, reducing confidence');
      confidence = 0.4;
      issues.push('Date seems very old');
    }

    if (parsedDate > oneMonthFromNow) {
      console.log('⚠️ Date is in the future, reducing confidence');
      confidence = 0.3;
      issues.push('Date is in the future');
    }

    console.log(`✅ Date validated: ${parsedDate.toISOString()}, confidence: ${confidence}`);
    
    return {
      correctedDate: parsedDate,
      confidence,
      issues
    };
  } catch (error) {
    console.error('❌ Error processing date:', error);
    return {
      correctedDate: new Date(),
      confidence: 0.1,
      issues: ['Date processing error']
    };
  }
}

export function mapPredictionToResult(prediction: any, document: any): MindeeOCRResult {
  // Calculate overall confidence
  const confidenceScores = [
    prediction.total_amount?.confidence,
    prediction.date?.confidence,
    prediction.supplier_name?.confidence
  ].filter(Boolean);
  
  const overallConfidence = confidenceScores.length > 0 
    ? confidenceScores.reduce((sum, val) => sum + val, 0) / confidenceScores.length 
    : 0.5;

  // Enhanced date processing with validation and fallback
  console.log('🔍 Processing date from prediction:', prediction.date?.value);
  const dateValidation = validateAndCorrectDate(prediction.date?.value);
  const processedDate = dateValidation.correctedDate;
  const dateConfidence = dateValidation.confidence;
  
  console.log('📅 Date processing result:', {
    original: prediction.date?.value,
    processed: processedDate,
    confidence: dateConfidence,
    issues: dateValidation.issues
  });

  // Process line items from v5 format
  const lineItems = processLineItems(prediction.line_items || []);
  
  return {
    // Basic receipt info
    amount: {
      value: prediction.total_amount?.value,
      confidence: prediction.total_amount?.confidence
    },
    date: {
      value: processedDate,
      confidence: dateConfidence
    },
    supplier: {
      value: prediction.supplier_name?.value || prediction.supplier?.value,
      confidence: prediction.supplier_name?.confidence || prediction.supplier?.confidence
    },
    
    // Enhanced receipt details
    lineItems: lineItems,
    tax: prediction.taxes && prediction.taxes.length > 0 ? {
      amount: prediction.taxes[0].value,
      rate: prediction.taxes[0].rate,
      confidence: prediction.taxes[0].confidence || 0
    } : undefined,
    total: {
      amount: prediction.total_amount?.value,
      confidence: prediction.total_amount?.confidence || 0
    },
    subtotal: prediction.subtotal_amount ? {
      amount: prediction.subtotal_amount.value,
      confidence: prediction.subtotal_amount.confidence || 0
    } : undefined,
    storeDetails: {
      name: prediction.supplier_name?.value || prediction.supplier?.value,
      address: prediction.supplier_address?.value,
      phone: prediction.supplier_phone_number?.value,
      website: prediction.supplier_website?.value,
      confidence: prediction.supplier_name?.confidence || 0
    },
    receiptNumber: prediction.receipt_number ? {
      value: prediction.receipt_number.value,
      confidence: prediction.receipt_number.confidence || 0
    } : undefined,
    transactionTime: prediction.time ? {
      value: new Date(`${processedDate || ''} ${prediction.time.value}`),
      confidence: prediction.time.confidence || 0
    } : undefined,
    currency: prediction.currency?.value,
    paymentMethod: prediction.payment?.method ? {
      type: prediction.payment.method,
      lastDigits: prediction.payment.card_number?.split(' ').pop(),
      confidence: prediction.payment.confidence ?? 0
    } : undefined,
    confidence_summary: {
      overall: overallConfidence,
      line_items: lineItems.length > 0 ? 
        lineItems.reduce((sum, item) => sum + item.confidence, 0) / lineItems.length : 0,
      total: prediction.total_amount?.confidence || 0,
      date: prediction.date?.confidence || 0,
      merchant: prediction.supplier_name?.confidence || 0
    }
  };
}
