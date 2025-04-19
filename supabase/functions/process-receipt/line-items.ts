
import { ReceiptLineItem, MindeeLineItem } from './types.ts';

function extractPrice(value: number | null): string {
  if (typeof value === 'number') {
    return (value / 100).toFixed(2);
  }
  return '0.00';
}

// Process line items from Mindee v5 API response
export function processLineItems(items: MindeeLineItem[]): ReceiptLineItem[] {
  return items.map(item => {
    console.log('Raw line item:', JSON.stringify(item, null, 2));
    
    const processedItem = {
      description: item.description || 'Unknown item',
      quantity: item.quantity ?? 1,
      unitPrice: extractPrice(item.unit_price),
      totalPrice: extractPrice(item.total_amount),
      confidence: calculateLineItemConfidence(item),
      discounted: !!item.discount,
      sku: item.product_code?.value
    };
    
    console.log('Processed line item:', JSON.stringify(processedItem, null, 2));
    return processedItem;
  });
}

// Calculate confidence for a line item
export function calculateLineItemConfidence(item: MindeeLineItem): number {
  const confidenceValues = [item.confidence].filter(Boolean);
  
  if (confidenceValues.length === 0) return 0;
  return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
}
