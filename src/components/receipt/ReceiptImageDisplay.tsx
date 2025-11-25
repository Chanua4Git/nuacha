import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getSignedReceiptUrl } from '@/utils/receipt/signedUrls';
import { Skeleton } from '@/components/ui/skeleton';

interface ReceiptImageDisplayProps {
  imageUrl: string;
  description?: string;
  confidence?: number;
  onDownload?: () => void;
}

const ReceiptImageDisplay: React.FC<ReceiptImageDisplayProps> = ({ 
  imageUrl, 
  description = "Receipt Image",
  confidence,
  onDownload 
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!imageUrl) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const url = await getSignedReceiptUrl(imageUrl);
        setSignedUrl(url);
      } catch (error) {
        console.error('Failed to get signed URL:', error);
        setSignedUrl(imageUrl); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSignedUrl();
  }, [imageUrl]);

  const displayUrl = signedUrl || imageUrl;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior using signed URL
      const link = document.createElement('a');
      link.href = displayUrl;
      link.download = `receipt-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {description}
          </CardTitle>
          <div className="flex items-center gap-2">
            {confidence && (
              <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Thumbnail view */}
          <div className="overflow-hidden rounded-md border">
            <img 
              src={displayUrl} 
              alt={description}
              className="w-full object-contain max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity" 
            />
          </div>
          
          {/* Zoom dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 flex items-center gap-1"
              >
                <ZoomIn className="w-4 h-4" />
                View Full Size
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{description}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                      disabled={zoom <= 0.5}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation((rotation + 90) % 360)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetView}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-auto max-h-[70vh] flex justify-center items-center">
                <img 
                  src={displayUrl} 
                  alt={description}
                  className="object-contain transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    maxWidth: 'none',
                    maxHeight: 'none'
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptImageDisplay;