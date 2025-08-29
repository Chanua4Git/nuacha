
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt, X, Loader2, Camera, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processReceiptImage, validateOCRResult } from '@/utils/receipt';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';

interface ReceiptUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onDataExtracted: (data: OCRResult) => void;
  imagePreview: string | null;
  familyId?: string;
}

const ReceiptUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  onDataExtracted,
  imagePreview,
  familyId
}: ReceiptUploadProps) => {
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
      const extractedData = await processReceiptImage(file, familyId);
      
      if (validateOCRResult(extractedData)) {
        onDataExtracted(extractedData);
        if (isRetry) {
          toast.success('Receipt details refreshed');
        } else {
          toast.success('Receipt details gently applied');
        }
      } else if (extractedData.error) {
        // The error will be handled by the toast messages in processReceiptImage
        onDataExtracted(extractedData); // Still provide any partial data for manual correction
      } else {
        toast("The receipt details weren't clear enough", {
          description: "Feel free to adjust the information as needed."
        });
        onDataExtracted(extractedData); // Still provide data for manual correction
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast("We couldn't read the receipt details", {
        description: "You can still add the information yourself when you're ready."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      {!imagePreview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-gray-200",
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="receipt-upload"
            ref={fileInputRef}
          />
          
          <div className="flex flex-col items-center gap-3">
            <Receipt className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-primary">Add a receipt</span> or gently drop it here
            </div>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            <p className="text-xs text-muted-foreground">We'll help fill in the details from your receipt</p>
            
            {/* Mobile-friendly option buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex justify-center items-center gap-2" 
                onClick={handleCameraClick}
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex justify-center items-center gap-2"
                onClick={handleUploadClick}
              >
                <Receipt className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border border-gray-200 p-2">
          <div className="flex justify-between items-start mb-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleRetry}
              disabled={isProcessing}
            >
              <RefreshCw className="h-3 w-3" />
              Re-scan
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7"
              onClick={onImageRemove}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <img
            src={imagePreview}
            alt="Receipt preview"
            className="w-full rounded-lg object-cover"
          />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
              <div className="bg-white p-4 rounded-md flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Reading your receipt...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;
