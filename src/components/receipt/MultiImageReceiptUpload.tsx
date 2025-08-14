import React, { useState, useRef } from 'react';
import { processReceiptImage } from '@/utils/receipt';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Camera, Upload, RefreshCw, Loader2, Plus, Layers } from 'lucide-react';
import { removeBackground, loadImage } from '@/utils/receipt/backgroundRemoval';

interface ReceiptSection {
  id: string;
  file: File;
  preview: string;
  isProcessing: boolean;
  ocrResult?: OCRResult;
  processedWithBackground?: boolean;
}

interface MultiImageReceiptUploadProps {
  onImagesUpload: (files: File[]) => void;
  onImagesRemove: () => void;
  onDataExtracted: (data: OCRResult) => void;
  isLongReceiptMode: boolean;
  onToggleLongReceiptMode: () => void;
}

const MultiImageReceiptUpload: React.FC<MultiImageReceiptUploadProps> = ({
  onImagesUpload,
  onImagesRemove,
  onDataExtracted,
  isLongReceiptMode,
  onToggleLongReceiptMode,
}) => {
  const [sections, setSections] = useState<ReceiptSection[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      await addSections(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await addSections(files);
    }
  };

  const addSections = async (files: File[]) => {
    const newSections: ReceiptSection[] = files.map((file) => ({
      id: `section-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      isProcessing: false,
    }));

    setSections(prev => [...prev, ...newSections]);
    onImagesUpload(files);

    if (isLongReceiptMode && files.length > 1) {
      toast('Multiple sections captured', {
        description: 'Review and process when ready.'
      });
    }
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => {
      const newSections = prev.filter(s => s.id !== sectionId);
      const removedSection = prev.find(s => s.id === sectionId);
      if (removedSection) {
        URL.revokeObjectURL(removedSection.preview);
      }
      
      if (newSections.length === 0) {
        onImagesRemove();
      }
      
      return newSections;
    });
  };

  const processSection = async (sectionId: string, withBackgroundRemoval = false) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, isProcessing: true } : s
    ));

    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      let fileToProcess = section.file;

      if (withBackgroundRemoval) {
        try {
          const img = await loadImage(section.file);
          const processedBlob = await removeBackground(img);
          fileToProcess = new File([processedBlob], 'processed-receipt.png', { type: 'image/png' });
          
          toast.success('Background removed', {
            description: 'Processing with enhanced clarity.'
          });
        } catch (error) {
          console.error('Background removal failed:', error);
          toast('Background removal skipped', {
            description: 'Processing with original image.'
          });
        }
      }

      const extractedData = await processReceiptImage(fileToProcess);

      setSections(prev => prev.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              isProcessing: false, 
              ocrResult: extractedData,
              processedWithBackground: withBackgroundRemoval
            } 
          : s
      ));

      if (extractedData && extractedData.confidence && extractedData.confidence > 0.3) {
        toast.success('Section processed successfully');
      }

    } catch (error) {
      console.error('Error processing section:', error);
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isProcessing: false } : s
      ));
      toast.error('Failed to process section');
    }
  };

  const processAllSections = async () => {
    setIsProcessingAll(true);
    
    try {
      console.log('Starting to process all sections:', sections.length);
      
      // Process all sections in parallel and collect results directly
      const processingPromises = sections.map(async (section) => {
        console.log('Processing section:', section.id);
        
        let fileToProcess = section.file;

        // Apply background removal
        try {
          const img = await loadImage(section.file);
          const processedBlob = await removeBackground(img);
          fileToProcess = new File([processedBlob], 'processed-receipt.png', { type: 'image/png' });
        } catch (error) {
          console.error('Background removal failed for section:', section.id, error);
        }

        // Process the receipt
        const extractedData = await processReceiptImage(fileToProcess);
        console.log('Extracted data for section:', section.id, extractedData);
        
        // Update state with the result
        setSections(prev => prev.map(s => 
          s.id === section.id 
            ? { 
                ...s, 
                isProcessing: false, 
                ocrResult: extractedData,
                processedWithBackground: true
              } 
            : s
        ));

        return extractedData;
      });

      // Wait for all processing to complete and collect results
      const allResults = await Promise.all(processingPromises);
      console.log('All processing complete. Results:', allResults);

      // Filter out null/undefined results
      const validResults = allResults.filter(Boolean) as OCRResult[];
      console.log('Valid results:', validResults);

      if (validResults.length > 0) {
        const mergedResult = mergeOCRResults(validResults);
        console.log('Merged result:', mergedResult);
        
        onDataExtracted(mergedResult);
        toast.success('All sections processed', {
          description: 'Receipt data has been merged and extracted.'
        });
      } else {
        console.warn('No valid OCR results found');
        toast.error('No valid data extracted from sections');
      }

    } catch (error) {
      console.error('Error processing all sections:', error);
      toast.error('Failed to process sections');
    } finally {
      setIsProcessingAll(false);
    }
  };

  const mergeOCRResults = (results: OCRResult[]): OCRResult => {
    console.log('🔀 Merging OCR results:', results);
    
    // Take the first valid result for basic fields
    const baseResult = results.find(r => r.confidence && r.confidence > 0.3) || results[0];
    console.log('📋 Base result selected:', baseResult);
    
    // Merge line items from all sections
    const allLineItems = results.flatMap(r => r.lineItems || []);
    console.log('📦 Combined line items:', allLineItems.length);
    
    // Calculate average confidence
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;
    
    // Find best amount from all results (highest confidence or first valid)
    const bestAmountResult = results
      .filter(r => r.amount)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    
    // Find best description from all results
    const bestDescriptionResult = results
      .filter(r => r.description)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    
    // Find best place from all results  
    const bestPlaceResult = results
      .filter(r => r.place)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];

    // Find best date from all results
    const bestDateResult = results
      .filter(r => r.date)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    
    const mergedResult: OCRResult = {
      ...baseResult,
      confidence: avgConfidence,
      lineItems: allLineItems,
      amount: bestAmountResult?.amount || baseResult.amount || '',
      description: bestDescriptionResult?.description || baseResult.description || '',
      place: bestPlaceResult?.place || baseResult.place || '',
      date: bestDateResult?.date || baseResult.date,
    };
    
    console.log('✅ Final merged result:', mergedResult);
    return mergedResult;
  };

  const clearAll = () => {
    sections.forEach(section => URL.revokeObjectURL(section.preview));
    setSections([]);
    onImagesRemove();
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

  return (
    <div className="space-y-4">
      {/* Long Receipt Mode Toggle */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant={isLongReceiptMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleLongReceiptMode}
          className="flex items-center gap-2"
        >
          <Layers className="h-4 w-4" />
          Long Receipt Mode
        </Button>
        
        {sections.length > 0 && (
          <Badge variant="secondary">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Upload Area */}
      {sections.length === 0 && (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-gray-500">
              {isLongReceiptMode ? (
                <>
                  <p className="text-lg font-medium mb-2">Capture Receipt Sections</p>
                  <p className="text-sm">Take photos of each section from top to bottom</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">Upload Receipt</p>
                  <p className="text-sm">Drag and drop or take a photo</p>
                </>
              )}
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraClick}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections Display */}
      {sections.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Receipt Sections</h3>
            <div className="flex gap-2">
              {isLongReceiptMode && sections.length > 1 && (
                <Button
                  onClick={processAllSections}
                  disabled={isProcessingAll || sections.some(s => s.isProcessing)}
                  size="sm"
                >
                  {isProcessingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing All...
                    </>
                  ) : (
                    'Process All Sections'
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <Card key={section.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">
                      Section {index + 1}
                      {section.processedWithBackground && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Enhanced
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSection(section.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <img
                    src={section.preview}
                    alt={`Receipt section ${index + 1}`}
                    className="w-full rounded-md object-cover max-h-40"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processSection(section.id, false)}
                      disabled={section.isProcessing}
                      className="flex-1"
                    >
                      {section.isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Process
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processSection(section.id, true)}
                      disabled={section.isProcessing}
                      className="flex-1"
                    >
                      Enhanced
                    </Button>
                  </div>

                  {section.ocrResult && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      Confidence: {Math.round((section.ocrResult.confidence || 0) * 100)}%
                      {section.ocrResult.lineItems && (
                        <div>Items: {section.ocrResult.lineItems.length}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add More Button */}
          {isLongReceiptMode && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 h-16 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Section
            </Button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isLongReceiptMode}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MultiImageReceiptUpload;