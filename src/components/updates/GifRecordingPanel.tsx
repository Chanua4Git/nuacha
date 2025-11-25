import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Circle, Square, Pause, Play, User, Ghost, ChevronRight, ChevronLeft, Film } from 'lucide-react';
import { useGifRecorder } from '@/hooks/useGifRecorder';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { AdminCaptureGuide } from './AdminCaptureGuide';

interface GifRecordingPanelProps {
  open: boolean;
  onClose: () => void;
  targetPath: string;
  stepTitle: string;
  onRecordingComplete: (gifBlob: Blob) => void;
  // Full step context
  moduleTitle: string;
  moduleTrack: string;
  stepDescription: string;
  screenshotHint?: string;
  detailedInstructions?: string;
  stepNumber: number;
  totalSteps: number;
}

export function GifRecordingPanel({
  open,
  onClose,
  targetPath,
  stepTitle,
  onRecordingComplete,
  moduleTitle,
  moduleTrack,
  stepDescription,
  screenshotHint,
  detailedInstructions,
  stepNumber,
  totalSteps,
}: GifRecordingPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastCaptureTime = useRef(0);
  const CAPTURE_INTERVAL = 100; // 10fps
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [previewMode, setPreviewMode] = useState<'authenticated' | 'guest'>('guest');
  const [showGuide, setShowGuide] = useState(true);
  
  const {
    isRecording,
    isPaused,
    recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formatDuration
  } = useGifRecorder();

  useEffect(() => {
    if (!open) {
      setIsIframeReady(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [open]);

  const handleIframeLoad = () => {
    setIsIframeReady(true);
  };

  const captureFrame = async () => {
    if (!iframeRef.current?.contentWindow?.document.body || !canvasRef.current) {
      return;
    }

    try {
      const canvas = await html2canvas(iframeRef.current.contentWindow.document.body, {
        useCORS: true,
        allowTaint: false,
        scale: 1,
        logging: false,
        width: 1280,
        height: 720
      });

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  };

  const startCaptureLoop = () => {
    const captureLoop = async () => {
      const now = Date.now();
      if (isRecordingRef.current && !isPausedRef.current) {
        if (now - lastCaptureTime.current >= CAPTURE_INTERVAL) {
          await captureFrame();
          lastCaptureTime.current = now;
        }
        animationFrameRef.current = requestAnimationFrame(captureLoop);
      }
    };
    captureLoop();
  };

  const handleStartRecording = async () => {
    if (!canvasRef.current) return;

    await captureFrame(); // Capture initial frame
    isRecordingRef.current = true;
    isPausedRef.current = false;
    lastCaptureTime.current = Date.now();
    await startRecording(canvasRef.current);
    startCaptureLoop();
  };

  const handleStopRecording = async () => {
    isRecordingRef.current = false;
    isPausedRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const blob = await stopRecording();
    if (blob) {
      onRecordingComplete(blob);
      onClose();
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      isPausedRef.current = false;
      resumeRecording();
      startCaptureLoop();
    } else {
      isPausedRef.current = true;
      pauseRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
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
            <DialogTitle>Recording: {stepTitle}</DialogTitle>

            <div className="flex items-center gap-3">
              {/* Preview mode toggle */}
              <div className="inline-flex rounded-lg border border-border bg-background p-1">
                <button
                  onClick={() => !isRecording && setPreviewMode('authenticated')}
                  disabled={isRecording}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors",
                    previewMode === 'authenticated' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground",
                    isRecording && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <User className="w-3 h-3" />
                  Auth
                </button>
                <button
                  onClick={() => !isRecording && setPreviewMode('guest')}
                  disabled={isRecording}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors",
                    previewMode === 'guest' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground",
                    isRecording && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Ghost className="w-3 h-3" />
                  Guest
                </button>
              </div>

              {isRecording && (
                <Badge variant="destructive" className="gap-2">
                  <Circle className="w-2 h-2 fill-current animate-pulse" />
                  REC {formatDuration(recordingDuration)}
                </Badge>
              )}
              
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    disabled={!isIframeReady}
                    size="sm"
                    className="gap-2"
                  >
                    <Circle className="w-4 h-4 fill-current" />
                    Start
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePauseResume}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden gap-3">
          {/* Main iframe area */}
          <div className="flex-1 relative border border-border rounded-lg overflow-hidden bg-muted">
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              key={iframeUrl}
              onLoad={handleIframeLoad}
              className="w-full h-full"
              title="Preview"
            />
            
            {isRecording && (
              <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                <Circle className="w-2 h-2 fill-current animate-pulse" />
                Recording
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Collapsible guide sidebar */}
          {showGuide ? (
            <div className="w-72 border border-border rounded-lg p-4 overflow-y-auto bg-background">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Film className="h-4 w-4" /> Recording Guide
                </h4>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowGuide(false)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
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
                isGif={true}
              />
            </div>
          ) : (
            <button 
              onClick={() => setShowGuide(true)}
              className="w-8 border border-border rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              aria-label="Show recording guide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
