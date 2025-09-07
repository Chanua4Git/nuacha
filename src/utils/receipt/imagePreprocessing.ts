import { toast } from 'sonner';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  enableEnhancement?: boolean;
}

export async function preprocessReceiptImage(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.9,
    enableEnhancement = true
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate optimal dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Apply preprocessing for better OCR
        if (enableEnhancement) {
          // Apply slight blur reduction and contrast enhancement
          ctx.filter = 'contrast(1.1) brightness(1.05)';
        }

        // Draw the image with preprocessing
        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create processed image'));
              return;
            }

            // Create new file with processed image
            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            console.log(`📸 Image preprocessed: ${Math.round(file.size / 1024)}KB → ${Math.round(processedFile.size / 1024)}KB`);
            resolve(processedFile);
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        console.error('Error preprocessing image:', error);
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export function checkImageQuality(file: File): Promise<{ 
  isLongReceipt: boolean; 
  recommendPreprocessing: boolean;
  aspectRatio: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const aspectRatio = img.height / img.width;
      const isLongReceipt = aspectRatio > 2.5; // Height is more than 2.5x the width
      const recommendPreprocessing = img.width > 2000 || img.height > 2000 || file.size > 3 * 1024 * 1024; // > 3MB
      
      console.log(`📐 Image analysis: ${img.width}x${img.height}, aspect ratio: ${aspectRatio.toFixed(2)}, size: ${Math.round(file.size / 1024)}KB`);
      
      resolve({
        isLongReceipt,
        recommendPreprocessing,
        aspectRatio
      });
    };

    img.onerror = () => {
      // If we can't analyze, assume no preprocessing needed
      resolve({
        isLongReceipt: false,
        recommendPreprocessing: false,
        aspectRatio: 1
      });
    };

    img.src = URL.createObjectURL(file);
  });
}