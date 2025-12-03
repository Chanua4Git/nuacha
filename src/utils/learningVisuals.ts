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
 * Also checks for legacy non-indexed clips (index 0)
 * Returns array of { index, extension, url, isLegacy } for found clips
 */
export const getExistingClips = async (
  moduleId: string,
  stepId: string
): Promise<Array<{ index: number; extension: string; url: string; isLegacy?: boolean }>> => {
  const extensions = ['mp4', 'webm'];
  const foundClips: Array<{ index: number; extension: string; url: string; isLegacy?: boolean }> = [];
  
  // First check for legacy non-indexed clip (stored at stepId.ext instead of stepId_1.ext)
  for (const ext of extensions) {
    const legacyUrl = getLearningVisualUrl(moduleId, stepId, 'gif', ext);
    try {
      const response = await fetch(legacyUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      const hasContent = contentLength && parseInt(contentLength) > 0;
      
      if (response.ok && hasContent) {
        foundClips.push({ index: 0, extension: ext, url: legacyUrl, isLegacy: true });
        break;
      }
    } catch {
      // Continue checking
    }
  }
  
  // Then check for indexed clips (1, 2, 3, etc.)
  for (let i = 1; i <= 10; i++) {
    let found = false;
    for (const ext of extensions) {
      const url = getLearningClipUrl(moduleId, stepId, i, ext);
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        const hasContent = contentLength && parseInt(contentLength) > 0;
        
        if (response.ok && hasContent) {
          foundClips.push({ index: i, extension: ext, url });
          found = true;
          break;
        }
      } catch {
        // Continue checking
      }
    }
    // Stop at first missing index after finding at least one indexed clip
    if (!found && i > 1 && foundClips.some(c => c.index >= 1)) break;
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
  // Check webm first (primary format), then mp4, then gif
  const extensions = ['webm', 'mp4', 'gif'];
  
  for (const ext of extensions) {
    const url = getLearningVisualUrl(moduleId, stepId, 'gif', ext);
    console.log(`[checkLegacyGif] Checking: ${url}`);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      const hasContent = contentLength && parseInt(contentLength) > 0;
      
      console.log(`[checkLegacyGif] Response for ${ext}:`, response.ok, response.status, `size: ${contentLength}`);
      
      if (response.ok && hasContent) {
        console.log(`[checkLegacyGif] Valid file found: ${url} (${contentLength} bytes)`);
        return url;
      } else if (response.ok && !hasContent) {
        console.log(`[checkLegacyGif] Skipping empty file: ${url}`);
      }
    } catch (err) {
      console.log(`[checkLegacyGif] Error checking ${ext}:`, err);
    }
  }
  
  return null;
};

/**
 * Get all clips for a step (includes legacy and indexed)
 * Filters by active status from localStorage
 * Returns array of URLs in order
 */
export const getAllClipsForStep = async (
  moduleId: string,
  stepId: string,
  filterActive: boolean = true
): Promise<string[]> => {
  console.log(`[getAllClipsForStep] Checking clips for ${moduleId}/${stepId}`);
  
  // Get all clips (now includes legacy at index 0)
  const allClips = await getExistingClips(moduleId, stepId);
  console.log(`[getAllClipsForStep] All clips found:`, allClips);
  
  if (allClips.length === 0) {
    return [];
  }
  
  // Filter by active status if requested
  if (filterActive && typeof window !== 'undefined') {
    const activeStatus = getClipActiveStatus();
    const activeClips = allClips.filter(clip => {
      const clipKey = `${moduleId}/${stepId}_${clip.index}`;
      // Default to active if not explicitly set
      return activeStatus[clipKey] !== false;
    });
    
    console.log(`[getAllClipsForStep] Active clips:`, activeClips);
    return activeClips.map(c => c.url);
  }
  
  return allClips.map(c => c.url);
};

// ============================================
// CLIP ACTIVE STATUS MANAGEMENT
// ============================================

const CLIP_STATUS_KEY = 'learning-clip-active-status';

/**
 * Get clip active status from localStorage
 */
export const getClipActiveStatus = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(CLIP_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Set clip active status
 */
export const setClipActiveStatus = (clipKey: string, isActive: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getClipActiveStatus();
    current[clipKey] = isActive;
    localStorage.setItem(CLIP_STATUS_KEY, JSON.stringify(current));
  } catch {
    console.error('Failed to save clip status');
  }
};

/**
 * Check if a clip is active (defaults to true)
 */
export const isClipActive = (moduleId: string, stepId: string, index: number): boolean => {
  const status = getClipActiveStatus();
  const clipKey = `${moduleId}/${stepId}_${index}`;
  return status[clipKey] !== false;
};

// ============================================
// MODULE STATUS MANAGEMENT (Active/Hidden/Coming Soon)
// ============================================

export type ModuleStatus = 'active' | 'hidden' | 'coming-soon';

const MODULE_STATUS_KEY = 'learning-module-status';

/**
 * Get module status from localStorage
 */
export const getModuleStatus = (moduleId: string): ModuleStatus => {
  if (typeof window === 'undefined') return 'active';
  
  try {
    const stored = localStorage.getItem(MODULE_STATUS_KEY);
    if (!stored) return 'active';
    const statuses = JSON.parse(stored);
    return statuses[moduleId] || 'active';
  } catch {
    return 'active';
  }
};

/**
 * Set module status
 */
export const setModuleStatus = (moduleId: string, status: ModuleStatus): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(MODULE_STATUS_KEY);
    const statuses = stored ? JSON.parse(stored) : {};
    statuses[moduleId] = status;
    localStorage.setItem(MODULE_STATUS_KEY, JSON.stringify(statuses));
  } catch {
    console.error('Failed to save module status');
  }
};

/**
 * Get all module statuses
 */
export const getAllModuleStatuses = (): Record<string, ModuleStatus> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(MODULE_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};