import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Camera, RefreshCw, User, Ghost, Info } from 'lucide-react';
import { captureIframe } from '@/utils/screenshotCapture';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AdminCaptureGuide } from './AdminCaptureGuide';

interface CapturePreviewPanelProps {
  open: boolean;
  onClose: () => void;
  targetPath: string;
  stepTitle: string;
  onCapture: (imageBlob: Blob) => void;
  // Full step context
  moduleTitle: string;
  moduleTrack: string;
  stepDescription: string;
  screenshotHint?: string;
  detailedInstructions?: string;
  stepNumber: number;
  totalSteps: number;
}

export const CapturePreviewPanel = ({
  open,
  onClose,
  targetPath,
  stepTitle,
  onCapture,
  moduleTitle,
  moduleTrack,
  stepDescription,
  screenshotHint,
  detailedInstructions,
  stepNumber,
  totalSteps,
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
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DialogTitle>Preview & Capture: {stepTitle}</DialogTitle>
              
              {/* Info popover with guide */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px]" align="start">
                  <AdminCaptureGuide
                    variant="popover"
                    moduleTitle={moduleTitle}
                    moduleTrack={moduleTrack}
                    stepTitle={stepTitle}
                    stepDescription={stepDescription}
                    stepNumber={stepNumber}
                    totalSteps={totalSteps}
                    screenshotHint={screenshotHint}
                    detailedInstructions={detailedInstructions}
                    targetPath={targetPath}
                    isGif={false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3">
              {/* Preview mode toggle */}
              <div className="inline-flex rounded-lg border border-border bg-background p-1">
                <button
                  onClick={() => !isCapturing && setPreviewMode('authenticated')}
                  disabled={isCapturing}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors",
                    previewMode === 'authenticated' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground",
                    isCapturing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <User className="w-3 h-3" />
                  Auth
                </button>
                <button
                  onClick={() => !isCapturing && setPreviewMode('guest')}
                  disabled={isCapturing}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors",
                    previewMode === 'guest' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground",
                    isCapturing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Ghost className="w-3 h-3" />
                  Guest
                </button>
              </div>

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
                {isCapturing ? 'Capturing...' : 'Capture'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 border rounded-lg overflow-hidden bg-muted">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            key={iframeUrl}
            className="w-full h-full"
            title="Preview"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
