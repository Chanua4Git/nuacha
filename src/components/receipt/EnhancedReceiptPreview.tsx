import React from 'react';
import { X, Loader2, RefreshCw, Sparkles, Check } from 'lucide-react';
import ReceiptProcessingLoader from '@/components/demo/ReceiptProcessingLoader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EnhancedReceiptPreviewProps {
  imagePreview: string;
  isProcessing: boolean;
  onRetry: () => void;
  onEnhancedRetry: () => void;
  onRemove: () => void;
  removeBackgroundEnabled: boolean;
  onToggleBackgroundRemoval: (enabled: boolean) => void;
  wasProcessedWithBackground: boolean;
}

const EnhancedReceiptPreview: React.FC<EnhancedReceiptPreviewProps> = ({
  imagePreview,
  isProcessing,
  onRetry,
  onEnhancedRetry,
  onRemove,
  removeBackgroundEnabled,
  onToggleBackgroundRemoval,
  wasProcessedWithBackground,
}) => {
  return (
    <div className="space-y-3">
      {/* Background Removal Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <Switch
            id="background-removal"
            checked={removeBackgroundEnabled}
            onCheckedChange={onToggleBackgroundRemoval}
          />
          <Label htmlFor="background-removal" className="text-sm font-medium">
            Remove background
          </Label>
          {wasProcessedWithBackground && (
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Enhanced
            </Badge>
          )}
        </div>
      </div>

      {/* Receipt Preview */}
      <div className="relative rounded-lg border border-gray-200 p-2">
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2">
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
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onEnhancedRetry}
              disabled={isProcessing}
            >
              <Sparkles className="h-3 w-3" />
              Enhanced
            </Button>
          </div>
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
          <ReceiptProcessingLoader />
        )}
      </div>
    </div>
  );
};

export default EnhancedReceiptPreview;