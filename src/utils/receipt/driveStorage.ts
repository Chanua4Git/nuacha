import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface DriveUploadResult {
  fileId: string;
  url: string;
  folderPath: string;
}

export interface DriveStorageMetadata {
  familyId: string;
  familyName: string;
  categoryName: string;
  description?: string;
  amount?: number;
  date?: Date;
}

/**
 * Upload receipt to Google Drive via edge function (optional - won't fail main upload)
 */
export async function uploadReceiptToDrive(
  file: File,
  metadata: DriveStorageMetadata
): Promise<DriveUploadResult | null> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Call edge function to upload to Drive
    const { data, error } = await supabase.functions.invoke('upload-to-drive', {
      body: {
        file: base64,
        fileName: file.name,
        mimeType: file.type,
        metadata: {
          familyId: metadata.familyId,
          familyName: metadata.familyName,
          categoryName: metadata.categoryName,
          description: metadata.description,
          amount: metadata.amount,
          date: metadata.date?.toISOString()
        }
      }
    });
    
    if (error) {
      console.warn('⚠️ Drive upload failed (continuing with Supabase only):', error);
      return null;
    }
    
    console.log('✅ Receipt uploaded to Drive:', data);
    return data;
  } catch (error) {
    console.warn('⚠️ Drive upload error (continuing with Supabase only):', error);
    return null;
  }
}

/**
 * Share a Drive folder with email addresses
 */
export async function shareDriveFolderWithEmails(
  folderId: string,
  emails: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('share-drive-folder', {
      body: { folderId, emails }
    });
    
    if (error) throw error;
    
    toast.success(`Folder shared with ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`);
    return true;
  } catch (error) {
    console.error('❌ Error sharing Drive folder:', error);
    toast.error("Couldn't share the folder", {
      description: "Please try again or share manually in Drive."
    });
    return false;
  }
}

/**
 * Get shareable link for a Drive file
 */
export async function getDriveShareableLink(fileId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-drive-link', {
      body: { fileId }
    });
    
    if (error) throw error;
    return data.url;
  } catch (error) {
    console.error('❌ Error getting Drive link:', error);
    return null;
  }
}

/**
 * Helper: Convert File to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
