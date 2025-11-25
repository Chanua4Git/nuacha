import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, Square, Pause, Play } from 'lucide-react';
import { useGifRecorder } from '@/hooks/useGifRecorder';
import html2canvas from 'html2canvas';

interface GifRecordingPanelProps {
  open: boolean;
  onClose: () => void;
  targetPath: string;
  stepTitle: string;
  onRecordingComplete: (gifBlob: Blob) => void;
}

export function GifRecordingPanel({
  open,
  onClose,
  targetPath,
  stepTitle,
  onRecordingComplete
}: GifRecordingPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  
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
      if (isRecording && !isPaused) {
        await captureFrame();
        animationFrameRef.current = requestAnimationFrame(captureLoop);
      }
    };
    captureLoop();
  };

  const handleStartRecording = async () => {
    if (!canvasRef.current) return;

    await captureFrame(); // Capture initial frame
    await startRecording(canvasRef.current);
    startCaptureLoop();
  };

  const handleStopRecording = async () => {
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
      resumeRecording();
      startCaptureLoop();
    } else {
      pauseRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Recording: {stepTitle}</DialogTitle>
            <div className="flex items-center gap-3">
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
                    className="gap-2"
                  >
                    <Circle className="w-4 h-4 fill-current" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePauseResume}
                      variant="outline"
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

        <div className="flex-1 relative border border-border rounded-lg overflow-hidden bg-muted">
          <iframe
            ref={iframeRef}
            src={targetPath}
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

        <div className="text-sm text-muted-foreground">
          💡 Interact with the app in the preview. Your actions will be recorded as a GIF.
        </div>
      </DialogContent>
    </Dialog>
  );
}
