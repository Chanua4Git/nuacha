
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { convertHeicToJpeg } from './imageProcessing';

export async function handleReceiptUpload(file: File): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // If user is authenticated, upload to storage
    if (session?.user) {
      const receiptUrl = await uploadReceiptToStorage(file, session.user.id);
      if (!receiptUrl) {
        return null;
      }
      
      console.log('📄 Processing receipt:', receiptUrl);
      return receiptUrl;
    } 
    // For unauthenticated users (demo mode), create a blob URL for direct processing
    else {
      console.log('🎯 Demo mode: Creating blob URL for direct OCR processing');
      
      // Convert HEIC to JPEG if needed
      const processedFile = await convertHeicToJpeg(file);
      
      // Create a blob URL that can be processed directly
      const blobUrl = URL.createObjectURL(processedFile);
      
      console.log('📄 Demo mode processing receipt:', blobUrl);
      return blobUrl;
    }
  } catch (error) {
    console.error('Error in handleReceiptUpload:', error);
    return null;
  }
}

async function ensureReceiptsBucketExists() {
  try {
    // Check if the receipts bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const receiptsBucket = buckets?.find(bucket => bucket.name === 'receipts');
    
    if (!receiptsBucket) {
      console.log('Creating receipts bucket...');
      // The bucket does not exist, try to create it in client side
      // Note: This will only work if the user has proper permissions
      // In production, you would typically create buckets via migration
      const { error } = await supabase.storage.createBucket('receipts', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Error creating receipts bucket:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error ensuring receipts bucket exists:', error);
    // Continue anyway, the upload will fail if the bucket really doesn't exist
  }
}

async function uploadReceiptToStorage(file: File, userId: string): Promise<string | null> {
  try {
    const processedFile = await convertHeicToJpeg(file);
    
    const fileExt = processedFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Error uploading receipt:', error);
      toast("We couldn't save your receipt right now", {
        description: "Let's try again in a moment, or you can add the details manually."
      });
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);
    
    console.log('📸 Receipt uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error in receipt upload:', error);
    toast("We couldn't save your receipt", {
      description: "You can still enter the details manually when you're ready."
    });
    return null;
  }
}
