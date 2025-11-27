import { supabase } from '@/integrations/supabase/client';

export type VisualType = 'ai-generated' | 'screenshot' | 'gif' | 'manual' | 'narrator';

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
    const extension = imageBlob.type.split('/')[1] || 'png';
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
  // For 'gif' type, we now store as webm video
  const ext = extension || (type === 'gif' ? 'webm' : 'png');
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
 * Check if a narrator video exists for a step
 */
export const checkNarratorExists = async (
  moduleId: string,
  stepId: string
): Promise<boolean> => {
  return checkVisualExists(moduleId, stepId, 'narrator', 'webm');
};
