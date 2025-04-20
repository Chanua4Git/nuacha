
import { ReceiptLineItem, MindeeLineItem } from './types.ts';

function extractPrice(value: number | null): string {
  if (typeof value !== 'number') {
    return '0.00';
  }

  // Values from Mindee are already in dollars.cents format
  // Add validation and sanity checks
  const price = value;
  
  // Log original value for debugging
  console.log(`Processing price value: ${price}`);
  
  // If the value is suspiciously low (< $1) but not zero
  if (price > 0 && price < 1) {
    // Check the original value to see if it might need correction
    const potentialCorrection = price * 100;
    
    // If the corrected value is within a reasonable range ($1-$1000)
    // it's likely we need to adjust the decimal point
    if (potentialCorrection >= 1 && potentialCorrection <= 1000) {
      console.log(`Price correction applied: ${price} -> ${potentialCorrection}`);
      return potentialCorrection.toFixed(2);
    }
  }
  
  // Normal case: price is already correct
  return price.toFixed(2);
}

// Process line items from Mindee v5 API response
export function processLineItems(items: MindeeLineItem[]): ReceiptLineItem[] {
  return items.map(item => {
    console.log('Raw line item:', JSON.stringify(item, null, 2));
    
    const unitPriceRaw = item.unit_price;
    const totalAmountRaw = item.total_amount;
    
    // Enhanced logging for price debugging
    console.log('Processing item:', {
      description: item.description,
      rawUnitPrice: unitPriceRaw,
      rawTotalAmount: totalAmountRaw
    });
    
    const processedItem = {
      description: item.description || 'Unknown item',
      quantity: item.quantity ?? 1,
      unitPrice: extractPrice(unitPriceRaw),
      totalPrice: extractPrice(totalAmountRaw),
      confidence: calculateLineItemConfidence(item),
      discounted: !!item.discount,
      sku: item.product_code?.value
    };
    
    // Log processed results
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
