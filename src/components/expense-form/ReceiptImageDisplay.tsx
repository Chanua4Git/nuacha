import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ReceiptImageDisplayProps {
  imageUrl: string;
  imagePreview?: string | null;
  description?: string;
  confidence?: number;
  onViewReceipt?: () => void;
}

export const ReceiptImageDisplay: React.FC<ReceiptImageDisplayProps> = ({ 
  imageUrl,
  imagePreview,
  description = "Receipt Image",
  confidence,
  onViewReceipt
}) => {
  const displayUrl = imagePreview || imageUrl;

  if (!displayUrl) return null;

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{description}</span>
            </div>
            {confidence && (
              <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>
          
          <div className="relative">
            {/* Thumbnail view */}
            <div className="overflow-hidden rounded-md border bg-muted/20">
              <img 
                src={displayUrl} 
                alt={description}
                className="w-full object-contain max-h-[200px] cursor-pointer hover:opacity-90 transition-opacity" 
                onClick={onViewReceipt}
              />
            </div>
            
            {/* Full size dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{description}</DialogTitle>
                </DialogHeader>
                <div className="overflow-auto max-h-[70vh] flex justify-center items-center">
                  <img 
                    src={displayUrl} 
                    alt={description}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptImageDisplay;