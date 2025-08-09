
import { MindeeOCRResult } from './types.ts';
import { processLineItems } from './line-items.ts';

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

  // Process line items from v5 format
  const lineItems = processLineItems(prediction.line_items || []);
  
  return {
    // Basic receipt info
    amount: {
      value: prediction.total_amount?.value,
      confidence: prediction.total_amount?.confidence
    },
    date: {
      value: prediction.date?.value,
      confidence: prediction.date?.confidence
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
      value: new Date(`${prediction.date?.value || ''} ${prediction.time.value}`),
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
