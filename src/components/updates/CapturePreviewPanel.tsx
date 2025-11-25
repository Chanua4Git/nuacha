import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, X, User, Ghost } from 'lucide-react';
import { captureIframe } from '@/utils/screenshotCapture';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CapturePreviewPanelProps {
  open: boolean;
  onClose: () => void;
  targetPath: string;
  stepTitle: string;
  onCapture: (imageBlob: Blob) => void;
}

export const CapturePreviewPanel = ({
  open,
  onClose,
  targetPath,
  stepTitle,
  onCapture,
}: CapturePreviewPanelProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'authenticated' | 'guest'>('guest');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleCapture = async () => {
    if (!iframeRef.current) {
      toast.error('Preview not loaded');
      return;
    }

    setIsCapturing(true);
    toast.info('Capturing screenshot...');

    try {
      const blob = await captureIframe(iframeRef.current);
      
      if (!blob) {
        toast.error('Failed to capture screenshot');
        return;
      }

      toast.success('Screenshot captured!');
      onCapture(blob);
      onClose();
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Build iframe URL with preview mode parameter
  const iframeUrl = previewMode === 'guest' 
    ? `${targetPath}${targetPath.includes('?') ? '&' : '?'}_preview_auth=false`
    : targetPath;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview & Capture: {stepTitle}</DialogTitle>
        </DialogHeader>

        {/* Preview Mode Toggle */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">Preview as:</span>
          <div className="inline-flex rounded-lg border border-border bg-background p-1">
            <button
              onClick={() => !isCapturing && setPreviewMode('authenticated')}
              disabled={isCapturing}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                previewMode === 'authenticated' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground",
                isCapturing && "opacity-50 cursor-not-allowed"
              )}
            >
              <User className="w-4 h-4" />
              Authenticated
            </button>
            <button
              onClick={() => !isCapturing && setPreviewMode('guest')}
              disabled={isCapturing}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                previewMode === 'guest' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground",
                isCapturing && "opacity-50 cursor-not-allowed"
              )}
            >
              <Ghost className="w-4 h-4" />
              Guest
            </button>
          </div>
          {previewMode === 'guest' && (
            <span className="text-xs text-muted-foreground">
              (Simulates unauthenticated user)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isCapturing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={handleCapture}
            disabled={isCapturing}
            size="sm"
          >
            <Camera className="h-4 w-4 mr-2" />
            {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            disabled={isCapturing}
            className="ml-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden bg-muted">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            key={iframeUrl}
            className="w-full h-full"
            title="Preview"
          />
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Interact with the preview above to set the desired UI state, then click "Capture Screenshot" to proceed to annotation.
        </p>
      </DialogContent>
    </Dialog>
  );
};
