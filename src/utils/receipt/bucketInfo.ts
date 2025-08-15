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
  },
  
  getPublicUrl: (path: string) => {
    // Supabase Storage public URL format
    const projectId = 'fjrxqeyexlusjwzzecal';
    return `https://${projectId}.supabase.co/storage/v1/object/public/${path}`;
  }
};

/**
 * Gets the bucket name where receipts are stored
 */
export const getReceiptsBucketName = (): string => {
  return RECEIPT_STORAGE_INFO.bucketName;
};

/**
 * Checks if a receipt URL belongs to the receipts bucket
 */
export const isReceiptFromBucket = (url: string): boolean => {
  return url.includes(`/storage/v1/object/public/${RECEIPT_STORAGE_INFO.bucketName}/`);
};