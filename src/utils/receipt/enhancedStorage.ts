import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { convertHeicToJpeg } from './imageProcessing';

/**
 * Enhanced storage utilities for organized receipt management
 */

export interface StorageMetadata {
  familyId: string;
  categoryName: string;
  description?: string;
  amount?: number;
  date?: Date;
}

/**
 * Upload receipt with organized folder structure
 * Structure: /receipts/{familyId}/{categoryName}/{timestamp}-{filename}.jpg
 */
export async function uploadReceiptToOrganizedStorage(
  file: File, 
  userId: string, 
  metadata: StorageMetadata
): Promise<string | null> {
  try {
    const processedFile = await convertHeicToJpeg(file);
    
    const fileExt = processedFile.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    
    // Create organized path
    const sanitizedCategory = metadata.categoryName.replace(/[^a-zA-Z0-9\-_]/g, '-');
    const fileName = `${userId}/${metadata.familyId}/${sanitizedCategory}/${timestamp}-${processedFile.name}`;
    
    console.log('📁 Uploading to organized path:', fileName);
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          familyId: metadata.familyId,
          categoryName: metadata.categoryName,
          description: metadata.description || '',
          amount: metadata.amount?.toString() || '',
          date: metadata.date?.toISOString() || '',
          uploadedAt: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('❌ Error uploading receipt:', error);
      
      // Fallback to regular upload if organized upload fails
      return await uploadReceiptToStorage(processedFile, userId);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);
    
    console.log('📸 Receipt uploaded to organized storage:', publicUrl);
    toast.success('Receipt saved and organized');
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Error in organized receipt upload:', error);
    
    // Fallback to regular upload
    return await uploadReceiptToStorage(file, userId);
  }
}

/**
 * Legacy upload function for backward compatibility
 */
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

/**
 * Get receipts for a specific family and category
 */
export async function getReceiptsForFamilyCategory(
  userId: string,
  familyId: string,
  categoryName?: string
): Promise<{ path: string; url: string; metadata: any }[]> {
  try {
    const basePath = `${userId}/${familyId}`;
    const searchPath = categoryName 
      ? `${basePath}/${categoryName.replace(/[^a-zA-Z0-9\-_]/g, '-')}`
      : basePath;
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .list(searchPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('Error listing receipts:', error);
      return [];
    }
    
    const receipts = data.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(`${searchPath}/${file.name}`);
      
      return {
        path: `${searchPath}/${file.name}`,
        url: publicUrl,
        metadata: file.metadata || {}
      };
    });
    
    return receipts;
  } catch (error) {
    console.error('Error getting receipts:', error);
    return [];
  }
}

/**
 * Generate downloadable receipt report for a family/category
 */
export async function generateReceiptReport(
  userId: string,
  familyId: string,
  categoryName?: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ zipUrl: string } | null> {
  try {
    // This would generate a zip file of receipts for download
    // Implementation would depend on backend support
    console.log('📊 Generating receipt report for:', { familyId, categoryName, dateRange });
    
    toast('Receipt report generation started', {
      description: 'This feature will be available soon'
    });
    
    return null;
  } catch (error) {
    console.error('Error generating receipt report:', error);
    return null;
  }
}