
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { convertHeicToJpeg } from './imageProcessing';

export async function handleReceiptUpload(file: File): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast("You'll need to sign in to upload receipts", {
        description: "We'll keep your receipt details secure."
      });
      throw new Error('Please sign in to upload receipts');
    }
    
    const receiptUrl = await uploadReceiptToStorage(file, session.user.id);
    if (!receiptUrl) {
      return null;
    }
    
    console.log('📄 Processing receipt:', receiptUrl);
    return receiptUrl;
  } catch (error) {
    console.error('Error in handleReceiptUpload:', error);
    return null;
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
