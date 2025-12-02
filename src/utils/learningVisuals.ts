import { supabase } from '@/integrations/supabase/client';

export type VisualType = 'ai-generated' | 'screenshot' | 'gif' | 'manual' | 'narrator';

/**
 * Map MIME type to proper file extension for videos
 */
const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    'video/quicktime': 'mov',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/x-matroska': 'mkv',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  
  return mimeToExt[mimeType] || mimeType.split('/')[1] || 'mp4';
};

/**
 * Upload an image to the learning-visuals storage bucket
 */
export const uploadLearningVisual = async (
  imageBlob: Blob,
  moduleId: string,
  stepId: string,
  type: VisualType = 'manual'
): Promise<string | null> => {
  try {
    const extension = getExtensionFromMimeType(imageBlob.type);
    const storagePath = `${type}/${moduleId}/${stepId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('learning-visuals')
      .upload(storagePath, imageBlob, {
        contentType: imageBlob.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    return getLearningVisualUrl(moduleId, stepId, type, extension);

  } catch (error) {
    console.error('Error uploading learning visual:', error);
    return null;
  }
};

/**
 * Get the public URL for a learning visual
 */
export const getLearningVisualUrl = (
  moduleId: string,
  stepId: string,
  type: VisualType = 'ai-generated',
  extension?: string
): string => {
  const supabaseUrl = 'https://fjrxqeyexlusjwzzecal.supabase.co';
  // For 'gif' type, default to mp4 since that's what we output from cropping
  const ext = extension || (type === 'gif' ? 'mp4' : 'png');
  return `${supabaseUrl}/storage/v1/object/public/learning-visuals/${type}/${moduleId}/${stepId}.${ext}`;
};

/**
 * Delete a learning visual from storage
 */
export const deleteLearningVisual = async (
  moduleId: string,
  stepId: string,
  type: VisualType = 'ai-generated',
  extension: string = 'png'
): Promise<boolean> => {
  try {
    const storagePath = `${type}/${moduleId}/${stepId}.${extension}`;

    const { error } = await supabase.storage
      .from('learning-visuals')
      .remove([storagePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error deleting learning visual:', error);
    return false;
  }
};

/**
 * Check if a visual exists for a given step
 */
export const checkVisualExists = async (
  moduleId: string,
  stepId: string,
  type: VisualType = 'ai-generated',
  extension: string = 'png'
): Promise<boolean> => {
  try {
    // Use HEAD request to directly check if file exists
    const url = getLearningVisualUrl(moduleId, stepId, type, extension);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking visual existence:', error);
    return false;
  }
};

/**
 * Upload a narrator video to storage
 */
export const uploadNarratorVideo = async (
  videoBlob: Blob,
  moduleId: string,
  stepId: string
): Promise<string | null> => {
  return uploadLearningVisual(videoBlob, moduleId, stepId, 'narrator');
};

/**
 * Get the narrator video URL for a learning step
 */
export const getNarratorVideoUrl = (
  moduleId: string,
  stepId: string,
  extension: string = 'webm'
): string => {
  return getLearningVisualUrl(moduleId, stepId, 'narrator', extension);
};

/**
 * Check if a narrator video exists for a step and return the extension if found
 */
export const checkNarratorExists = async (
  moduleId: string,
  stepId: string
): Promise<string | null> => {
  // Check for multiple video formats in priority order
  const videoExtensions = ['webm', 'mp4', 'mov'];
  
  for (const ext of videoExtensions) {
    const exists = await checkVisualExists(moduleId, stepId, 'narrator', ext);
    if (exists) {
      return ext; // Return the extension that exists
    }
  }
  
  return null; // No video found
};

// ============================================
// MULTI-CLIP SUPPORT FUNCTIONS
// ============================================

/**
 * Upload a clip with index support for multiple clips per step
 * Path convention: gif/{moduleId}/{stepId}_{index}.{ext}
 */
export const uploadLearningClip = async (
  blob: Blob,
  moduleId: string,
  stepId: string,
  clipIndex: number = 1
): Promise<string | null> => {
  try {
    const extension = getExtensionFromMimeType(blob.type);
    const storagePath = `gif/${moduleId}/${stepId}_${clipIndex}.${extension}`;

    const { error } = await supabase.storage
      .from('learning-visuals')
      .upload(storagePath, blob, {
        contentType: blob.type,
        upsert: true
      });

    if (error) {
      console.error('Upload clip error:', error);
      throw error;
    }

    return getLearningClipUrl(moduleId, stepId, clipIndex, extension);
  } catch (error) {
    console.error('Error uploading clip:', error);
    return null;
  }
};

/**
 * Get URL for a specific clip index
 */
export const getLearningClipUrl = (
  moduleId: string,
  stepId: string,
  clipIndex: number,
  extension: string = 'mp4'
): string => {
  const supabaseUrl = 'https://fjrxqeyexlusjwzzecal.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/learning-visuals/gif/${moduleId}/${stepId}_${clipIndex}.${extension}`;
};

/**
 * Check how many indexed clips exist for a step (checks up to 10)
 * Returns array of { index, extension } for found clips
 */
export const getExistingClips = async (
  moduleId: string,
  stepId: string
): Promise<Array<{ index: number; extension: string; url: string }>> => {
  const extensions = ['mp4', 'webm'];
  const foundClips: Array<{ index: number; extension: string; url: string }> = [];
  
  for (let i = 1; i <= 10; i++) {
    let found = false;
    for (const ext of extensions) {
      const url = getLearningClipUrl(moduleId, stepId, i, ext);
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          foundClips.push({ index: i, extension: ext, url });
          found = true;
          break;
        }
      } catch {
        // Continue checking
      }
    }
    // Stop at first missing index (clips must be sequential)
    if (!found && i > 1 && foundClips.length > 0) break;
  }
  
  return foundClips;
};

/**
 * Get count of clips for a step
 */
export const getClipCount = async (
  moduleId: string,
  stepId: string
): Promise<number> => {
  const clips = await getExistingClips(moduleId, stepId);
  return clips.length;
};

/**
 * Delete a specific clip
 */
export const deleteLearningClip = async (
  moduleId: string,
  stepId: string,
  clipIndex: number,
  extension: string = 'mp4'
): Promise<boolean> => {
  try {
    const storagePath = `gif/${moduleId}/${stepId}_${clipIndex}.${extension}`;
    const { error } = await supabase.storage
      .from('learning-visuals')
      .remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
};

/**
 * Get next available clip index for a step
 */
export const getNextClipIndex = async (
  moduleId: string,
  stepId: string
): Promise<number> => {
  const clips = await getExistingClips(moduleId, stepId);
  if (clips.length === 0) return 1;
  return Math.max(...clips.map(c => c.index)) + 1;
};

/**
 * Check for legacy single-file GIF (backward compatibility)
 * Returns URL if found, null otherwise
 */
export const checkLegacyGif = async (
  moduleId: string,
  stepId: string
): Promise<string | null> => {
  const extensions = ['mp4', 'webm'];
  
  for (const ext of extensions) {
    const url = getLearningVisualUrl(moduleId, stepId, 'gif', ext);
    console.log(`[checkLegacyGif] Checking: ${url}`);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`[checkLegacyGif] Response for ${ext}:`, response.ok, response.status);
      if (response.ok) {
        return url;
      }
    } catch (err) {
      console.log(`[checkLegacyGif] Error checking ${ext}:`, err);
    }
  }
  
  return null;
};

/**
 * Get all clips for a step (includes legacy single-file check)
 * Returns array of URLs in order
 */
export const getAllClipsForStep = async (
  moduleId: string,
  stepId: string
): Promise<string[]> => {
  console.log(`[getAllClipsForStep] Checking clips for ${moduleId}/${stepId}`);
  
  // First check for indexed clips
  const indexedClips = await getExistingClips(moduleId, stepId);
  console.log(`[getAllClipsForStep] Indexed clips:`, indexedClips);
  
  if (indexedClips.length > 0) {
    return indexedClips.map(c => c.url);
  }
  
  // Fall back to legacy single-file check
  const legacyUrl = await checkLegacyGif(moduleId, stepId);
  console.log(`[getAllClipsForStep] Legacy check result:`, legacyUrl);
  
  if (legacyUrl) {
    return [legacyUrl];
  }
  
  return [];
};