import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { OCRResult } from '@/types/expense';
import { ReceiptPage, detectPartialReceipt, mergeReceiptPages, calculateLineItemsSubtotal } from '@/utils/receipt/mergeReceipts';
import ReceiptUpload from '../ReceiptUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MultiPageReceiptFlowProps {
  familyId?: string;
  onComplete: (mergedOcrResult: OCRResult, receiptImages: string[]) => void;
  onCancel: () => void;
}

const MultiPageReceiptFlow: React.FC<MultiPageReceiptFlowProps> = ({
  familyId,
  onComplete,
  onCancel,
}) => {
  const [pages, setPages] = useState<ReceiptPage[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [isScanning, setIsScanning] = useState(true);

  const handlePageScanned = (ocrResult: OCRResult, imageUrl: string) => {
    const detection = detectPartialReceipt(ocrResult);
    
    const newPage: ReceiptPage = {
      pageNumber: currentPageNumber,
      ocrResult,
      imageUrl,
      isPartial: detection.isPartial,
    };

    setPages(prev => [...prev, newPage]);
    setIsScanning(false);

    // Auto-prompt for next page if this one is partial
    if (detection.isPartial) {
      console.log(`📄 Page ${currentPageNumber} is partial:`, detection.reason);
    }
  };

  const handleAddAnotherPage = () => {
    setCurrentPageNumber(prev => prev + 1);
    setIsScanning(true);
  };

  const handleFinalize = () => {
    if (pages.length === 0) return;

    const mergedResult = mergeReceiptPages(pages);
    const imageUrls = pages.map(p => p.imageUrl);
    
    onComplete(mergedResult, imageUrls);
  };

  const handleRemovePage = (pageNumber: number) => {
    setPages(prev => prev.filter(p => p.pageNumber !== pageNumber));
  };

  const lastPage = pages[pages.length - 1];
  const lastPageDetection = lastPage ? detectPartialReceipt(lastPage.ocrResult) : null;
  const hasCompleteReceipt = lastPage && !lastPageDetection?.isPartial;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Multi-Page Receipt Scan</span>
            <Badge variant="outline">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'} scanned
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current scanning area */}
          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Scanning Page {currentPageNumber}</h3>
                {currentPageNumber > 1 && (
                  <Button variant="outline" size="sm" onClick={() => setIsScanning(false)}>
                    Cancel
                  </Button>
                )}
              </div>
              <ReceiptUpload
                onImageUpload={() => {}}
                onImageRemove={() => {}}
                onDataExtracted={(result) => {
                  const imageUrl = ''; // Will be set by parent component
                  handlePageScanned(result, imageUrl);
                }}
                imagePreview={null}
                familyId={familyId}
              />
            </div>
          )}

          {/* Scanned pages list */}
          {pages.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Scanned Pages</h3>
              <div className="space-y-2">
                {pages.map(page => (
                  <Card key={page.pageNumber} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="h-5 w-5 mt-1 text-muted-foreground" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Page {page.pageNumber}</span>
                            {page.isPartial ? (
                              <Badge variant="outline" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Partial
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {page.ocrResult.place && <div>Store: {page.ocrResult.place}</div>}
                            {page.ocrResult.lineItems && page.ocrResult.lineItems.length > 0 && (
                              <div>{page.ocrResult.lineItems.length} items</div>
                            )}
                            {page.ocrResult.amount && parseFloat(page.ocrResult.amount) > 0 ? (
                              <div className="font-medium">Total: ${page.ocrResult.amount}</div>
                            ) : page.ocrResult.lineItems && page.ocrResult.lineItems.length > 0 ? (
                              <div className="text-xs">Subtotal: ${calculateLineItemsSubtotal(page.ocrResult.lineItems).toFixed(2)}</div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePage(page.pageNumber)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Guidance message */}
          {!isScanning && lastPageDetection && lastPageDetection.isPartial && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {lastPageDetection.reason}. Would you like to scan another page?
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          {!isScanning && pages.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAddAnotherPage}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Page
              </Button>
              <Button
                onClick={handleFinalize}
                className="flex-1"
                disabled={pages.length === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Finalize Receipt
                {hasCompleteReceipt && ' ✓'}
              </Button>
            </div>
          )}

          {pages.length > 0 && (
            <Button variant="ghost" onClick={onCancel} className="w-full">
              Cancel Multi-Page Scan
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiPageReceiptFlow;
