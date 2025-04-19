
import React, { useState, useRef } from 'react';
import { processReceiptImage } from '@/utils/receipt';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import UploadArea from './UploadArea';
import ReceiptPreview from './ReceiptPreview';

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

  const processReceipt = async (file: File, isRetry = false) => {
    setCurrentFile(file);
    onImageUpload(file);
    
    setIsProcessing(true);
    try {
      const extractedData = await processReceiptImage(file);
      
      if (extractedData) {
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
        <ReceiptPreview
          imagePreview={imagePreview}
          isProcessing={isProcessing}
          onRetry={handleRetry}
          onRemove={onImageRemove}
        />
      )}
    </div>
  );
};

export default ReceiptUpload;
