
import { ReceiptLineItem } from './types.ts';

// Process line items from Mindee v5 API response
export function processLineItems(items: any[]): ReceiptLineItem[] {
  return items.map(item => {
    console.log('Processing line item:', item);
    
    return {
      description: item.description || 'Unknown item',
      quantity: item.quantity || 1,
      unitPrice: item.unit_price?.amount?.value || '0',
      totalPrice: item.total_amount?.amount?.value || '0',
      confidence: calculateLineItemConfidence(item),
      discounted: !!item.discount,
      sku: item.product_code?.value
    };
  });
}

// Calculate confidence for a line item
export function calculateLineItemConfidence(item: any): number {
  const confidenceValues = [
    item.confidence,
    item.description_confidence,
    item.quantity_confidence,
    item.unit_price?.confidence,
    item.total_amount?.confidence
  ].filter(Boolean);
  
  if (confidenceValues.length === 0) return 0;
  return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
}

