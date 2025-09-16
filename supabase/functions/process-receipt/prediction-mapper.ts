
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

// Helper to convert v2 confidence values to numeric scores
function convertV2Confidence(confidence: string | undefined): number {
  if (!confidence) return 0.5;
  
  switch (confidence.toLowerCase()) {
    case 'certain': return 0.95;
    case 'high': return 0.8;
    case 'medium': return 0.6;
    case 'low': return 0.3;
    default: return 0.5;
  }
}

/**
 * Maps Mindee v2 inference results to MindeeOCRResult format
 */
export function mapPredictionToResult(inference: any, document: any): MindeeOCRResult {
  try {
    console.log('🔄 Mapping Mindee v2 inference to result format');
    
    if (!inference || !inference.result) {
      console.error('❌ No inference result data provided');
      return { error: 'No inference result data available' };
    }

    const fields = inference.result.fields;
    if (!fields) {
      console.error('❌ No fields data in inference result');
      return { error: 'No fields data available in inference result' };
    }

    console.log('📊 Available v2 fields:', Object.keys(fields));

    // Enhanced date processing with validation
    const dateField = fields.date || fields.receipt_date || fields.transaction_date;
    const dateValidation = validateAndCorrectDate(
      dateField?.value,
      inference.file ? {
        fileName: inference.file.name,
        timestamp: Date.now()
      } : undefined
    );

    // Extract total amount - try multiple field names for v2
    const totalAmountField = fields.total_amount || fields.total || fields.amount || fields.total_incl;
    const totalAmount = totalAmountField?.value;
    const totalConfidence = convertV2Confidence(totalAmountField?.confidence);

    // Extract supplier information
    const supplierField = fields.supplier_name || fields.merchant || fields.vendor || fields.supplier;
    const supplierName = supplierField?.value;
    const supplierConfidence = convertV2Confidence(supplierField?.confidence);

    // Extract line items if present - v2 format
    const lineItemsField = fields.line_items || fields.items || [];
    let lineItems = [];
    
    if (Array.isArray(lineItemsField)) {
      lineItems = lineItemsField.map((item: any, index: number) => {
        const itemConfidence = convertV2Confidence(item.confidence);
        
        return {
          description: item.description?.value || item.description || `Item ${index + 1}`,
          quantity: item.quantity?.value || item.quantity || 1,
          unit_price: item.unit_price?.value || item.unit_price || null,
          total_amount: item.total_amount?.value || item.total_amount || item.amount?.value || null,
          confidence: itemConfidence,
          discount: item.discount?.value || false,
          product_code: item.product_code?.value ? { value: item.product_code.value } : undefined
        };
      });
    } else {
      // Handle case where line_items might be processed by the existing line-items processor
      lineItems = processLineItems(lineItemsField || []);
    }

    // Calculate overall confidence score
    const confidenceScores = [totalConfidence, dateValidation.confidence, supplierConfidence]
      .filter(score => score > 0);
    
    const overallConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
      : 0.5;

    // Extract tax information
    const taxField = fields.taxes || fields.tax || fields.total_tax;
    let taxAmount, taxRate, taxConfidence;
    
    if (Array.isArray(taxField) && taxField.length > 0) {
      taxAmount = taxField[0]?.value || taxField[0]?.amount?.value;
      taxRate = taxField[0]?.rate?.value;
      taxConfidence = convertV2Confidence(taxField[0]?.confidence);
    } else if (taxField) {
      taxAmount = taxField?.value || taxField?.amount?.value;
      taxRate = taxField?.rate?.value;
      taxConfidence = convertV2Confidence(taxField?.confidence);
    }

    // Extract subtotal
    const subtotalField = fields.subtotal || fields.total_net || fields.net_amount || fields.subtotal_amount;
    const subtotal = subtotalField?.value;
    const subtotalConfidence = convertV2Confidence(subtotalField?.confidence);

    // Extract additional fields
    const receiptNumberField = fields.receipt_number || fields.reference_number;
    const currencyField = fields.currency || fields.locale?.currency;
    
    const result: MindeeOCRResult = {
      amount: totalAmount ? {
        value: totalAmount.toString(),
        confidence: totalConfidence
      } : undefined,
      
      date: {
        value: dateValidation.correctedDate.toISOString(),
        confidence: dateValidation.confidence
      },
      
      supplier: supplierName ? {
        value: supplierName,
        confidence: supplierConfidence
      } : undefined,
      
      lineItems,
      
      tax: taxAmount ? {
        amount: taxAmount.toString(),
        rate: taxRate?.toString(),
        confidence: taxConfidence || 0.5
      } : undefined,
      
      total: totalAmount ? {
        amount: totalAmount.toString(),
        confidence: totalConfidence
      } : undefined,
      
      subtotal: subtotal ? {
        amount: subtotal.toString(),
        confidence: subtotalConfidence
      } : undefined,
      
      storeDetails: supplierName ? {
        name: supplierName,
        address: fields.supplier_address?.value,
        phone: fields.supplier_phone?.value || fields.phone?.value,
        website: fields.supplier_website?.value || fields.website?.value,
        confidence: supplierConfidence
      } : undefined,
      
      receiptNumber: receiptNumberField?.value ? {
        value: receiptNumberField.value,
        confidence: convertV2Confidence(receiptNumberField.confidence)
      } : undefined,
      
      transactionTime: fields.time?.value ? {
        value: new Date(`${dateValidation.correctedDate.toDateString()} ${fields.time.value}`),
        confidence: convertV2Confidence(fields.time.confidence)
      } : undefined,
      
      currency: currencyField?.value || currencyField || 'USD',
      confidence: overallConfidence,
      
      confidence_summary: {
        overall: overallConfidence,
        line_items: lineItems.length > 0 
          ? lineItems.reduce((sum, item) => sum + item.confidence, 0) / lineItems.length 
          : 0,
        total: totalConfidence,
        date: dateValidation.confidence,
        merchant: supplierConfidence
      }
    };

    console.log(`✅ Successfully mapped v2 inference result (confidence: ${overallConfidence.toFixed(2)})`);
    console.log(`📊 Extracted: amount=${totalAmount}, supplier=${supplierName}, lineItems=${lineItems.length}`);
    
    return result;

  } catch (error) {
    console.error('❌ Error mapping v2 inference to result:', error);
    return {
      error: `Failed to process v2 receipt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}
