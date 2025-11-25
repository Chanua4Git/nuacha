/**
 * Receipt Storage Information
 * 
 * This file provides information about where receipts are stored in Supabase Storage.
 */

export const RECEIPT_STORAGE_INFO = {
  // The primary bucket where all receipts are stored
  bucketName: 'receipts',
  
  // Storage structure: /receipts/{familyId}/{categoryName}/{timestamp}-{filename}
  // Examples:
  // - /receipts/family-123/Groceries/20250801-jta-receipt.jpg
  // - /receipts/family-456/Medical/20250802-pharmacy-receipt.png
  
  getReceiptPath: (familyId: string, categoryName: string, filename: string) => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `receipts/${familyId}/${categoryName}/${timestamp}-${filename}`;
  }
};

/**
 * Gets the bucket name where receipts are stored
 */
export const getReceiptsBucketName = (): string => {
  return RECEIPT_STORAGE_INFO.bucketName;
};