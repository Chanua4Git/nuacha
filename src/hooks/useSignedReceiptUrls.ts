import { useState, useEffect } from 'react';
import { getSignedReceiptUrls } from '@/utils/receipt/signedUrls';

/**
 * Hook to manage signed URLs for a list of receipt URLs
 * Automatically generates signed URLs and caches them
 */
export function useSignedReceiptUrls(receiptUrls: string[]) {
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (receiptUrls.length === 0) return;
      
      setIsLoading(true);
      try {
        const urls = await getSignedReceiptUrls(receiptUrls);
        setSignedUrls(urls);
      } catch (error) {
        console.error('Failed to get signed URLs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSignedUrls();
  }, [receiptUrls.join(',')]); // Re-fetch when URLs change
  
  const getSignedUrl = (originalUrl: string) => 
    signedUrls.get(originalUrl) || originalUrl;
  
  return { signedUrls, getSignedUrl, isLoading };
}
