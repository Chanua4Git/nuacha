/**
 * Utility functions for merging multiple receipt scans into a single expense
 * Handles multi-page receipts where user scans top, middle, and bottom separately
 */

import { OCRResult, ReceiptLineItem } from '@/types/expense';

export interface ReceiptPage {
  pageNumber: number;
  ocrResult: OCRResult;
  imageUrl: string;
  isPartial: boolean;
}

/**
 * Check if receipt is complete (has all required information)
 */
export function isReceiptComplete(ocrResult: OCRResult): boolean {
  const hasTotal = !!(ocrResult.total || ocrResult.amount);
  const hasStoreName = !!(ocrResult.place || ocrResult.storeDetails?.name);
  
  // Check for completion indicators in line items or payment info
  const hasPaymentInfo = !!ocrResult.paymentMethod;
  const hasCompletionIndicators = 
    hasPaymentInfo ||
    (ocrResult.lineItems?.some(item => 
      /total|balance|thank you|paid|change due|amount due/i.test(item.description || '')
    )) || false;
  
  return hasTotal && hasStoreName && hasCompletionIndicators;
}

/**
 * Detect if a receipt scan is partial (missing header or footer information)
 */
export function detectPartialReceipt(ocrResult: OCRResult): {
  isPartial: boolean;
  missingHeader: boolean;
  missingFooter: boolean;
  reason: string;
} {
  // First check if receipt is COMPLETE
  if (isReceiptComplete(ocrResult)) {
    return {
      isPartial: false,
      missingHeader: false,
      missingFooter: false,
      reason: 'Receipt appears complete'
    };
  }

  const hasTotal = ocrResult.amount && parseFloat(ocrResult.amount) > 0;
  const hasMerchant = Boolean(ocrResult.place || ocrResult.storeDetails?.name);
  const hasLineItems = ocrResult.lineItems && ocrResult.lineItems.length > 0;

  let missingHeader = !hasMerchant;
  let missingFooter = !hasTotal;
  let isPartial = missingHeader || missingFooter;
  
  let reason = '';
  if (missingHeader && missingFooter) {
    reason = 'This appears to be a middle section of a receipt';
  } else if (missingHeader) {
    reason = 'This appears to be the bottom section of a receipt (missing store name)';
  } else if (missingFooter) {
    reason = 'This appears to be the top or middle section of a receipt (missing total)';
  }

  // Special case: if we have line items but no total, definitely partial
  if (hasLineItems && !hasTotal) {
    isPartial = true;
    missingFooter = true;
    reason = 'Partial receipt detected - line items found but total is missing';
  }

  return {
    isPartial,
    missingHeader,
    missingFooter,
    reason
  };
}

/**
 * Calculate subtotal from line items
 */
export function calculateLineItemsSubtotal(lineItems: ReceiptLineItem[]): number {
  if (!lineItems || lineItems.length === 0) return 0;
  
  return lineItems.reduce((sum, item) => {
    const price = parseFloat(item.totalPrice || '0');
    return sum + price;
  }, 0);
}

/**
 * Calculate string similarity using Jaccard index
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Check if two line items are similar (likely duplicates)
 */
function areLineItemsSimilar(item1: ReceiptLineItem, item2: ReceiptLineItem): boolean {
  const desc1 = item1.description.toLowerCase().trim();
  const desc2 = item2.description.toLowerCase().trim();
  
  // Exact match
  if (desc1 === desc2) return true;
  
  // Fuzzy match (80% similarity)
  const similarity = calculateStringSimilarity(desc1, desc2);
  if (similarity > 0.8) return true;
  
  // Price + description match (strong indicator)
  if (item1.totalPrice === item2.totalPrice && similarity > 0.6) return true;
  
  return false;
}

/**
 * Deduplicate line items based on description and price similarity
 */
function deduplicateLineItems(items: ReceiptLineItem[]): ReceiptLineItem[] {
  const unique: ReceiptLineItem[] = [];
  
  for (const item of items) {
    const isDuplicate = unique.some(existingItem => 
      areLineItemsSimilar(item, existingItem)
    );
    
    if (!isDuplicate) {
      unique.push(item);
    }
  }
  
  return unique;
}

/**
 * Merge multiple receipt scans into a single OCR result
 * Strategy:
 * - Use first page for header info (merchant, date)
 * - Use last page for footer info (total, tax, payment)
 * - Combine all line items and deduplicate
 */
export function mergeReceiptPages(pages: ReceiptPage[]): OCRResult {
  if (pages.length === 0) {
    throw new Error('No pages to merge');
  }

  if (pages.length === 1) {
    return pages[0].ocrResult;
  }

  // Sort by page number
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const firstPage = sortedPages[0].ocrResult;
  const lastPage = sortedPages[sortedPages.length - 1].ocrResult;

  // Combine all line items
  const allLineItems: ReceiptLineItem[] = [];
  sortedPages.forEach(page => {
    if (page.ocrResult.lineItems) {
      allLineItems.push(...page.ocrResult.lineItems);
    }
  });

  // Deduplicate line items
  const uniqueLineItems = deduplicateLineItems(allLineItems);

  // Calculate combined confidence
  const avgConfidence = sortedPages.reduce((sum, page) => 
    sum + (page.ocrResult.confidence || 0), 0) / sortedPages.length;

  // Merge the data
  const mergedResult: OCRResult = {
    // Header info from first page
    place: firstPage.place || lastPage.place || '',
    date: firstPage.date || lastPage.date,
    storeDetails: firstPage.storeDetails || lastPage.storeDetails,
    
    // Footer info from last page (or calculate from line items if missing)
    amount: lastPage.amount || calculateLineItemsSubtotal(uniqueLineItems).toFixed(2),
    total: lastPage.total,
    tax: lastPage.tax,
    subtotal: lastPage.subtotal,
    discount: lastPage.discount,
    paymentMethod: lastPage.paymentMethod,
    receiptNumber: lastPage.receiptNumber,
    transactionTime: lastPage.transactionTime,
    currency: lastPage.currency || firstPage.currency,
    
    // Combined line items
    lineItems: uniqueLineItems,
    
    // Use highest confidence
    confidence: Math.max(...sortedPages.map(p => p.ocrResult.confidence || 0)),
    
    // Merge confidence summaries
    confidence_summary: lastPage.confidence_summary || firstPage.confidence_summary,
  };

  console.log(`📑 Merged ${pages.length} receipt pages:`, {
    lineItemsBefore: allLineItems.length,
    lineItemsAfter: uniqueLineItems.length,
    deduplicatedCount: allLineItems.length - uniqueLineItems.length,
    finalTotal: mergedResult.amount,
    calculatedSubtotal: calculateLineItemsSubtotal(uniqueLineItems)
  });

  return mergedResult;
}

/**
 * Get a user-friendly message about what's missing from the receipt
 */
export function getPartialReceiptGuidance(ocrResult: OCRResult): string | null {
  const detection = detectPartialReceipt(ocrResult);
  
  if (!detection.isPartial) {
    return null;
  }

  const missingParts: string[] = [];
  if (detection.missingHeader) {
    missingParts.push('store name');
  }
  if (detection.missingFooter) {
    missingParts.push('final total');
  }

  if (missingParts.length === 0) {
    return null;
  }

  return `Missing: ${missingParts.join(' and ')}. Scan the ${detection.missingHeader ? 'top' : 'bottom'} of the receipt to capture complete information.`;
}
