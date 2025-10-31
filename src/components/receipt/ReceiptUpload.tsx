
import React, { useState, useRef } from 'react';
import { processReceiptImage } from '@/utils/receipt';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import { removeBackground, loadImage } from '@/utils/receipt/backgroundRemoval';
import { preprocessReceiptImage } from '@/utils/receipt/imagePreprocessing';
import { mergeReceiptPages, detectPartialReceipt } from '@/utils/receipt/mergeReceipts';
import { Button } from '@/components/ui/button';
import { Check, Layers } from 'lucide-react';
import UploadArea from './UploadArea';
import EnhancedReceiptPreview from './EnhancedReceiptPreview';

interface ReceiptUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onDataExtracted: (data: OCRResult) => void;
  imagePreview: string | null;
  familyId?: string;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ 
  onImageUpload, 
  onImageRemove, 
  onDataExtracted,
  imagePreview,
  familyId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(true);
  const [wasProcessedWithBackground, setWasProcessedWithBackground] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  
  // Multi-page receipt support
  const [receiptPages, setReceiptPages] = useState<Array<{
    pageNumber: number;
    imageUrl: string;
    ocrResult: OCRResult;
  }>>([]);
  const [isMultiPageMode, setIsMultiPageMode] = useState(false);

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

  const handleAddAnotherPage = () => {
    // Save current scan as a page
    if (imagePreview && ocrResult) {
      const pageNumber = receiptPages.length + 1;
      setReceiptPages(prev => [...prev, { 
        pageNumber,
        imageUrl: imagePreview, 
        ocrResult 
      }]);
      setIsMultiPageMode(true);
      
      // Clear current scan to allow new upload
      onImageRemove();
      setOcrResult(null);
      
      toast.info(`Page ${pageNumber} saved`, {
        description: 'Ready to scan the next section of your receipt'
      });
    }
  };

  const handleFinalizeMultiPage = () => {
    if (receiptPages.length === 0) return;

    try {
      // Add current page if there is one
      const allPages = [...receiptPages];
      if (imagePreview && ocrResult) {
        allPages.push({
          pageNumber: allPages.length + 1,
          imageUrl: imagePreview,
          ocrResult
        });
      }

      // Merge all pages
      const mergedResult = mergeReceiptPages(allPages.map(p => ({
        pageNumber: p.pageNumber,
        ocrResult: p.ocrResult,
        imageUrl: p.imageUrl,
        isPartial: detectPartialReceipt(p.ocrResult).isPartial
      })));

      // Pass merged data to parent
      onDataExtracted(mergedResult);
      
      toast.success(`Receipt finalized with ${allPages.length} pages`, {
        description: 'All sections have been merged into one expense'
      });

      // Reset multi-page state
      setReceiptPages([]);
      setIsMultiPageMode(false);
      setOcrResult(null);
    } catch (error) {
      console.error('Error finalizing multi-page receipt:', error);
      toast.error('Failed to merge receipt pages', {
        description: 'Please try scanning again'
      });
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
    
    setIsProcessing(true);
    try {
      let fileToProcess = file;
      let fileToSave = file; // This will be the file we pass to onImageUpload

      // Apply image preprocessing (includes auto-rotation for long receipts)
      try {
        const preprocessedFile = await preprocessReceiptImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.9,
          enableEnhancement: true
        });
        fileToProcess = preprocessedFile;
        fileToSave = preprocessedFile; // Use preprocessed for both processing and saving
        console.log('✅ Image preprocessing completed');
      } catch (error) {
        console.error('Image preprocessing failed, using original:', error);
        // Continue with original file
      }

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

      const extractedData = await processReceiptImage(fileToProcess, familyId);
      
      if (extractedData) {
        // Store OCR result for partial detection
        setOcrResult(extractedData);
        
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
    <div className="space-y-3">
      {/* Multi-page progress indicator */}
      {isMultiPageMode && receiptPages.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Multi-Page Receipt Mode</span>
          </div>
          <div className="space-y-1">
            {receiptPages.map((page) => (
              <div key={page.pageNumber} className="text-xs text-muted-foreground flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Page {page.pageNumber}: {page.ocrResult.place || 'Receipt'} 
                {page.ocrResult.lineItems?.length ? ` (${page.ocrResult.lineItems.length} items)` : ''}
              </div>
            ))}
            {imagePreview && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-3 w-3" />
                Page {receiptPages.length + 1}: Current scan
              </div>
            )}
          </div>
        </div>
      )}

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
          ocrResult={ocrResult}
          onAddAnotherPage={handleAddAnotherPage}
        />
      )}

      {/* Finalize button for multi-page receipts */}
      {(receiptPages.length > 0 || (isMultiPageMode && imagePreview)) && (
        <Button 
          onClick={handleFinalizeMultiPage} 
          className="w-full"
          size="lg"
        >
          <Check className="mr-2 h-4 w-4" />
          Finalize Receipt ({receiptPages.length + (imagePreview ? 1 : 0)} page{receiptPages.length + (imagePreview ? 1 : 0) !== 1 ? 's' : ''})
        </Button>
      )}
    </div>
  );
};

export default ReceiptUpload;
