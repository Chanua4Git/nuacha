
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Receipt, X, Loader2, Camera, RefreshCw, Check, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processReceiptImage, validateOCRResult } from '@/utils/receipt';
import { mergeReceiptPages, detectPartialReceipt, calculateLineItemsSubtotal, isReceiptComplete } from '@/utils/receipt/mergeReceipts';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';

interface ReceiptUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onDataExtracted: (data: OCRResult) => void;
  imagePreview: string | null;
  familyId?: string;
  disableInternalCTAs?: boolean; // When true, parent component handles all multi-page CTAs
}

const ReceiptUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  onDataExtracted,
  imagePreview,
  familyId,
  disableInternalCTAs = false
}: ReceiptUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
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

  const handleAddAnotherPage = () => {
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
    // Combine current scan with saved pages
    const allPages = [...receiptPages];
    if (imagePreview && ocrResult) {
      allPages.push({
        pageNumber: allPages.length + 1,
        imageUrl: imagePreview,
        ocrResult
      });
    }

    if (allPages.length === 0) return;

    // Merge all pages
    const mergedResult = mergeReceiptPages(allPages.map(p => ({
      pageNumber: p.pageNumber,
      ocrResult: p.ocrResult,
      imageUrl: p.imageUrl,
      isPartial: detectPartialReceipt(p.ocrResult).isPartial
    })));

    onDataExtracted(mergedResult);
    
    // Reset multi-page state
    setReceiptPages([]);
    setIsMultiPageMode(false);
    setOcrResult(null);
    
    toast.success(`${allPages.length} pages merged into complete receipt`, {
      description: 'All sections have been combined'
    });
  };

  const processReceipt = async (file: File, isRetry = false) => {
    setCurrentFile(file);
    onImageUpload(file);
    
    setIsProcessing(true);
    try {
      const extractedData = await processReceiptImage(file, familyId);
      setOcrResult(extractedData); // Store OCR result for multi-page handling
      
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

      // Check if this completes the multi-page receipt
      if (receiptPages.length > 0 && isReceiptComplete(extractedData)) {
        toast.success("Complete receipt detected!", {
          description: "This page appears to complete your receipt. Ready to finalize?"
        });
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

  // Detect if current scan is partial or complete
  const partialDetection = ocrResult ? detectPartialReceipt(ocrResult) : null;
  const isComplete = ocrResult ? isReceiptComplete(ocrResult) : false;

  // Auto-enter multi-page mode when partial receipt is detected
  useEffect(() => {
    if (partialDetection?.isPartial && !isMultiPageMode) {
      setIsMultiPageMode(true);
    }
  }, [partialDetection?.isPartial]);

  return (
    <div className="space-y-3">
      {/* Visual page counter when in multi-page mode */}
      {!disableInternalCTAs && isMultiPageMode && imagePreview && (
        <div className="text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-accent text-accent-foreground px-3 py-1 text-sm font-medium">
            <Layers className="h-3 w-3 mr-1.5" />
            Scanning page {receiptPages.length + 1}
          </span>
        </div>
      )}

      {/* Multi-page progress indicator */}
      {!disableInternalCTAs && isMultiPageMode && receiptPages.length > 0 && (
        <Alert className="bg-accent/10 border-accent">
          <Layers className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Multi-page receipt in progress</span>
              <span className="inline-flex items-center justify-center rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-medium">
                {receiptPages.length} saved
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Tip: Scan top first, then bottom for totals.</p>
            <div className="space-y-1">
              {receiptPages.map((page, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-3 w-3 text-accent" />
                  <span>Page {page.pageNumber}: {page.ocrResult.place || 'Receipt'} ({page.ocrResult.lineItems?.length || 0} items)</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Receipt completion status */}
      {!disableInternalCTAs && imagePreview && ocrResult && isComplete && receiptPages.length > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Receipt Complete!</strong> This page shows the final total. Ready to finalize your multi-page receipt.
          </AlertDescription>
        </Alert>
      )}

      {/* Partial receipt warning with action button - only show if not complete */}
      {!disableInternalCTAs && imagePreview && ocrResult && partialDetection?.isPartial && !isComplete && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-amber-900">Partial Receipt</p>
                <p className="text-sm text-amber-800 mt-1">{partialDetection.reason}</p>
                {ocrResult.lineItems && ocrResult.lineItems.length > 0 && (
                  <p className="text-sm text-amber-700 mt-1">
                    Subtotal from scanned items: ${calculateLineItemsSubtotal(ocrResult.lineItems).toFixed(2)}
                  </p>
                )}
              </div>
              {!isProcessing && (
                <Button
                  onClick={handleAddAnotherPage}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Scan Next Page of Receipt
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

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
          <div className="flex justify-between items-start mb-2 gap-2">
            <div className="flex gap-2 flex-wrap">
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
              
              {/* Scan Next Page button - appears when partial receipt detected and not complete */}
              {!disableInternalCTAs && ocrResult && partialDetection?.isPartial && !isComplete && !isProcessing && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleAddAnotherPage}
                >
                  <Plus className="h-3 w-3" />
                  Scan Next Page of Receipt
                </Button>
              )}
            </div>
            
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7 shrink-0"
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
      
      {/* Finalize Multi-Page Receipt button - emphasize when complete */}
      {!disableInternalCTAs && (receiptPages.length > 0 || (isMultiPageMode && imagePreview && ocrResult)) && (
        <Button
          onClick={handleFinalizeMultiPage}
          className={cn(
            "w-full",
            isComplete && "bg-green-600 hover:bg-green-700 text-white"
          )}
          size="lg"
          disabled={isProcessing}
        >
          <Check className="mr-2 h-4 w-4" />
          Finalize Receipt ({receiptPages.length + (imagePreview && ocrResult ? 1 : 0)} page{receiptPages.length + (imagePreview && ocrResult ? 1 : 0) > 1 ? 's' : ''})
        </Button>
      )}

      {/* Mobile-friendly sticky footer for multi-page actions - only show if not complete */}
      {!disableInternalCTAs && imagePreview && ocrResult && partialDetection?.isPartial && !isComplete && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg md:hidden z-50">
          <div className="flex gap-2 max-w-lg mx-auto">
            <Button
              onClick={handleAddAnotherPage}
              className="flex-1"
              disabled={isProcessing}
            >
              <Plus className="mr-2 h-4 w-4" />
              Scan next page
            </Button>
            {receiptPages.length > 0 && (
              <Button
                onClick={handleFinalizeMultiPage}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                <Check className="mr-2 h-4 w-4" />
                Finalize ({receiptPages.length + 1})
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile sticky footer when receipt is complete */}
      {!disableInternalCTAs && imagePreview && ocrResult && isComplete && receiptPages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg md:hidden z-50">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={handleFinalizeMultiPage}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isProcessing}
            >
              <Check className="mr-2 h-4 w-4" />
              Finalize Complete Receipt ({receiptPages.length + 1} pages)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;
