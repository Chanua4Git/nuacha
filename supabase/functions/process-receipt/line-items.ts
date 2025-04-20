
import { ReceiptLineItem, MindeeLineItem } from './types.ts';

function extractPrice(value: number | null): string {
  if (typeof value !== 'number') {
    return '0.00';
  }
  
  // Price values from Mindee are often in cents, so we need to convert
  // If the value is very small (< 1) but the original price on receipt would
  // likely be more than $1, multiply by 100 to fix decimal placement
  if (value < 1) {
    // Check if this is likely a parsing error (decimal misplacement)
    // Most grocery items cost more than $1, so if it's less than $1
    // it might be a decimal point issue
    const correctedValue = value * 100;
    
    // Only apply correction if it makes sense (e.g., 0.41 -> 41.00)
    if (correctedValue >= 1 && correctedValue <= 1000) {
      console.log(`Correcting likely decimal error: ${value} -> ${correctedValue}`);
      return correctedValue.toFixed(2);
    }
  }
  
  // Regular case (value already in dollars)
  return (value / 100).toFixed(2);
}

// Process line items from Mindee v5 API response
export function processLineItems(items: MindeeLineItem[]): ReceiptLineItem[] {
  return items.map(item => {
    console.log('Raw line item:', JSON.stringify(item, null, 2));
    
    const unitPriceRaw = item.unit_price;
    const totalAmountRaw = item.total_amount;
    
    // Log original values for debugging
    console.log(`Original values - unit price: ${unitPriceRaw}, total amount: ${totalAmountRaw}`);
    
    const processedItem = {
      description: item.description || 'Unknown item',
      quantity: item.quantity ?? 1,
      unitPrice: extractPrice(unitPriceRaw),
      totalPrice: extractPrice(totalAmountRaw),
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
