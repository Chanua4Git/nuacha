import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, Square, ChevronRight, ChevronLeft, Film, Upload, Smartphone } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isRecording,
    hasRecording,
    error,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    reset,
    uploadVideo,
    isMobile,
    supportsScreenCapture,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVideo(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Show mobile UI if on mobile device OR if screen capture isn't supported
  const showMobileUI = isMobile || !supportsScreenCapture;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              {showMobileUI && <Smartphone className="h-4 w-4" />}
              Recording: {stepTitle}
            </DialogTitle>

            <div className="flex items-center gap-3">
              {isRecording && (
                <Badge variant="destructive" className="gap-2">
                  <Circle className="w-2 h-2 fill-current animate-pulse" />
                  REC
                </Badge>
              )}
              {showMobileUI && (
                <Badge variant="secondary">Mobile Mode</Badge>
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
            
            {/* MOBILE UI: Native recording instructions + upload */}
            {showMobileUI && !hasRecording && (
              <div className="w-full space-y-6 max-w-xl mx-auto text-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Recording on Mobile
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use your device's built-in screen recording, then upload the file here.
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border text-left space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How to record:</p>
                  <ul className="text-sm space-y-2">
                    <li className="flex gap-2">
                      <span className="font-medium">iPhone/iPad:</span>
                      <span className="text-muted-foreground">Control Center → Screen Recording button</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium">Android:</span>
                      <span className="text-muted-foreground">Pull down Quick Settings → Screen Record</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border text-left space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What to capture:</p>
                  <p className="text-sm">{screenshotHint || stepDescription}</p>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button onClick={handleUploadClick} size="lg" className="w-full gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Screen Recording
                </Button>

                <p className="text-xs text-muted-foreground">
                  ✨ Your recording is already mobile-sized — no cropping needed!
                </p>
              </div>
            )}

            {/* DESKTOP UI: Screen Capture API */}
            {!showMobileUI && !isRecording && !hasRecording && (
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

            {/* State: Recording (desktop only) */}
            {!showMobileUI && isRecording && (
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

            {/* State: Recorded (preview) - both mobile and desktop */}
            {hasRecording && (
              <div className="max-w-3xl mx-auto space-y-4 w-full">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Preview Recording</h3>
                  <p className="text-sm text-muted-foreground">
                    {showMobileUI 
                      ? "Review your recording. You can trim it in the editor if needed."
                      : "Review your recording. You can trim and crop to mobile in the editor."
                    }
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
                  {showMobileUI 
                    ? "Next: Trim start/end in the editor if needed."
                    : "Next: Trim start/end and crop to mobile size in the editor."
                  }
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
