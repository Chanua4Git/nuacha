
import React, { useState, useRef } from 'react';
import { processReceiptImage } from '@/utils/receipt';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import { removeBackground, loadImage } from '@/utils/receipt/backgroundRemoval';
import UploadArea from './UploadArea';
import EnhancedReceiptPreview from './EnhancedReceiptPreview';

interface ReceiptUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onDataExtracted: (data: OCRResult) => void;
  imagePreview: string | null;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ 
  onImageUpload, 
  onImageRemove, 
  onDataExtracted,
  imagePreview 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(true);
  const [wasProcessedWithBackground, setWasProcessedWithBackground] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await processReceipt(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processReceipt(file);
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleRetry = async () => {
    if (currentFile) {
      await processReceipt(currentFile, true);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEnhancedRetry = async () => {
    if (currentFile) {
      await processReceipt(currentFile, true, true);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const checkIfLongReceipt = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.height / img.width;
        // Consider receipts with aspect ratio > 2.5 as "long"
        const isLong = aspectRatio > 2.5;
        console.log(`📏 Image dimensions: ${img.width}x${img.height}, aspect ratio: ${aspectRatio.toFixed(2)}, isLong: ${isLong}`);
        resolve(isLong);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const processReceipt = async (file: File, isRetry = false, withBackgroundRemoval = false) => {
    setCurrentFile(file);
    
    // Check if this is a long receipt and warn user
    if (!isRetry) {
      const isLongReceipt = await checkIfLongReceipt(file);
      if (isLongReceipt) {
        toast('📏 Long receipt detected', {
          description: 'For better results, consider using Long Receipt Mode to split into sections.',
          duration: 5000,
        });
      }
    }
    
    setIsProcessing(true);
    try {
      let fileToProcess = file;
      let fileToSave = file; // This will be the file we pass to onImageUpload

      // Apply background removal if enabled
      if (withBackgroundRemoval || removeBackgroundEnabled) {
        try {
          const img = await loadImage(file);
          const processedBlob = await removeBackground(img);
          fileToProcess = new File([processedBlob], 'processed-receipt.png', { type: 'image/png' });
          fileToSave = fileToProcess; // Use the processed file for saving
          setWasProcessedWithBackground(true);
          
          toast.success('Background removed', {
            description: 'Processing with enhanced clarity.'
          });
        } catch (error) {
          console.error('Background removal failed:', error);
          toast('Background removal skipped', {
            description: 'Processing with original image.'
          });
          setWasProcessedWithBackground(false);
          // fileToSave remains the original file
        }
      } else {
        setWasProcessedWithBackground(false);
        // fileToSave remains the original file
      }

      // Upload the appropriate file (processed or original)
      onImageUpload(fileToSave);

      const extractedData = await processReceiptImage(fileToProcess);
      
      if (extractedData) {
        // Log quality indicators for long receipts
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          if (aspectRatio > 2.5) {
            console.log('⚠️ Long receipt processed in regular mode - OCR quality may be reduced');
            console.log('💡 Suggestion: Use Long Receipt Mode for better accuracy');
          }
        };
        img.src = URL.createObjectURL(file);
        
        onDataExtracted(extractedData);
        if (isRetry) {
          toast.success('Receipt details refreshed');
        } else {
          toast.success('Receipt details gently applied');
        }
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast("We couldn't read the receipt details", {
        description: "You can still add the information manually when you're ready."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      {!imagePreview ? (
        <UploadArea
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isDragging={isDragging}
          fileInputRef={fileInputRef}
          onCameraClick={handleCameraClick}
          onUploadClick={handleUploadClick}
          handleFileSelect={handleFileSelect}
        />
      ) : (
        <EnhancedReceiptPreview
          imagePreview={imagePreview}
          isProcessing={isProcessing}
          onRetry={handleRetry}
          onEnhancedRetry={handleEnhancedRetry}
          onRemove={onImageRemove}
          removeBackgroundEnabled={removeBackgroundEnabled}
          onToggleBackgroundRemoval={setRemoveBackgroundEnabled}
          wasProcessedWithBackground={wasProcessedWithBackground}
        />
      )}
    </div>
  );
};

export default ReceiptUpload;
