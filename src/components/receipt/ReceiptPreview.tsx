
import React from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReceiptPreviewProps {
  imagePreview: string;
  isProcessing: boolean;
  onRetry: () => void;
  onRemove: () => void;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  imagePreview,
  isProcessing,
  onRetry,
  onRemove,
}) => {
  return (
    <div className="relative rounded-lg border border-gray-200 p-2">
      <div className="flex justify-between items-start mb-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={onRetry}
          disabled={isProcessing}
        >
          <RefreshCw className="h-3 w-3" />
          Re-scan
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7"
          onClick={onRemove}
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
  );
};

export default ReceiptPreview;
