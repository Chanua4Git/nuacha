import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, Square, ChevronRight, ChevronLeft, Film } from 'lucide-react';
import { useGifRecorder } from '@/hooks/useGifRecorder';
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
  const [showGuide, setShowGuide] = useState(true);
  
  const {
    isRecording,
    hasRecording,
    error,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    reset,
  } = useGifRecorder();

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleStart = async () => {
    await startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleUseRecording = () => {
    if (videoBlob) {
      onRecordingComplete(videoBlob);
    }
  };

  const handleDiscard = () => {
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Recording: {stepTitle}</DialogTitle>

            <div className="flex items-center gap-3">
              {isRecording && (
                <Badge variant="destructive" className="gap-2">
                  <Circle className="w-2 h-2 fill-current animate-pulse" />
                  REC
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden gap-3">
          {/* Main content area */}
          <div className="flex-1 relative border border-border rounded-lg overflow-y-auto bg-muted p-6 flex flex-col justify-center">
            
            {/* State: Idle (no recording yet) */}
            {!isRecording && !hasRecording && (
              <div className="w-full space-y-6 max-w-xl mx-auto text-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">Ready to Record</h3>
                  <p className="text-sm text-muted-foreground">
                    Click Start, select your browser tab with the app, and perform the interaction.
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border text-left space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What to capture:</p>
                  <p className="text-sm">{screenshotHint || stepDescription}</p>
                </div>

                <Button onClick={handleStart} size="lg" className="w-full gap-2">
                  <Circle className="w-4 h-4 fill-current" />
                  Start Recording
                </Button>

                <p className="text-xs text-muted-foreground">
                  💡 Record at any screen size. You can crop to mobile in the editor afterward.
                </p>
              </div>
            )}

            {/* State: Recording */}
            {isRecording && (
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-destructive font-semibold text-lg">
                    <Circle className="w-3 h-3 fill-current animate-pulse" />
                    Recording in progress…
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Perform the interaction you want to show. The screen capture is recording your actions.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    When finished, click <strong>Stop Recording</strong> below.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleStop} variant="destructive" size="lg" className="gap-2">
                    <Square className="w-4 h-4" />
                    Stop Recording
                  </Button>
                </div>
              </div>
            )}

            {/* State: Recorded (preview) */}
            {!isRecording && hasRecording && (
              <div className="max-w-3xl mx-auto space-y-4 w-full">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Preview Recording</h3>
                  <p className="text-sm text-muted-foreground">
                    Review your recording. You can trim and crop to mobile in the editor.
                  </p>
                </div>

                {videoUrl && (
                  <div className="rounded-lg border border-border overflow-hidden bg-black">
                    <video
                      className="w-full max-h-[400px]"
                      src={videoUrl}
                      controls
                      playsInline
                      autoPlay
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={handleUseRecording} size="lg" className="gap-2">
                    Use This Recording
                  </Button>

                  <Button onClick={handleDiscard} variant="outline" size="lg">
                    Discard & Retry
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Next: Trim start/end and crop to mobile size in the editor.
                </p>
              </div>
            )}
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
