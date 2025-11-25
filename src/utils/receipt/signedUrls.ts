import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'receipts';
const PUBLIC_URL_PREFIX = `https://fjrxqeyexlusjwzzecal.supabase.co/storage/v1/object/public/${BUCKET_NAME}/`;

/**
 * Extract storage path from a public URL
 * e.g., "https://...supabase.co/storage/v1/object/public/receipts/user/family/file.jpg" 
 *       → "user/family/file.jpg"
 */
export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  
  if (url.includes('/storage/v1/object/public/receipts/')) {
    return url.split('/storage/v1/object/public/receipts/')[1];
  }
  
  // If it's already just a path, return as-is
  if (!url.startsWith('http')) {
    return url;
  }
  
  return null;
}

/**
 * Get a signed URL for a single receipt (expires in 1 hour)
 */
export async function getSignedReceiptUrl(
  urlOrPath: string, 
  expiresIn: number = 3600
): Promise<string | null> {
  const path = extractPathFromUrl(urlOrPath);
  if (!path) return urlOrPath; // Return original if can't extract path
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);
    
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
}

/**
 * Get multiple signed URLs at once (for gallery views)
 */
export async function getSignedReceiptUrls(
  urlsOrPaths: string[], 
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const paths = urlsOrPaths
    .map(url => extractPathFromUrl(url))
    .filter((p): p is string => p !== null);
    
  if (paths.length === 0) return new Map();
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrls(paths, expiresIn);
    
  const urlMap = new Map<string, string>();
  
  if (error || !data) {
    console.error('Error creating signed URLs:', error);
    return urlMap;
  }
  
  // Map original URLs to signed URLs
  data.forEach((item, index) => {
    if (item.signedUrl) {
      urlMap.set(urlsOrPaths[index], item.signedUrl);
    }
  });
  
  return urlMap;
}
