
import { ReceiptLineItem, MindeeLineItem } from './types.ts';

// Process line items from Mindee v5 API response
export function processLineItems(items: MindeeLineItem[]): ReceiptLineItem[] {
  return items.map(item => {
    console.log('Raw line item:', JSON.stringify(item, null, 2));
    
    return {
      description: item.description?.value || 'Unknown item',
      quantity: item.quantity?.value || 1,
      unitPrice: item.unit_price?.amount?.value?.toString() || '0',
      totalPrice: item.total_amount?.amount?.value?.toString() || '0',
      confidence: calculateLineItemConfidence(item),
      discounted: !!item.discount,
      sku: item.product_code?.value
    };
  });
}

// Calculate confidence for a line item
export function calculateLineItemConfidence(item: MindeeLineItem): number {
  const confidenceValues = [
    item.confidence,
    item.description?.confidence,
    item.quantity?.confidence,
    item.unit_price?.confidence,
    item.total_amount?.confidence
  ].filter(Boolean);
  
  if (confidenceValues.length === 0) return 0;
  return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
}
