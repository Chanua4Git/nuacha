import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, Square, User, Ghost, ChevronRight, ChevronLeft, Film, Smartphone, Tablet, Monitor, ExternalLink } from 'lucide-react';
import { useGifRecorder } from '@/hooks/useGifRecorder';
import { cn } from '@/lib/utils';
import { AdminCaptureGuide } from './AdminCaptureGuide';

type DevicePreset = 'mobile' | 'tablet' | 'desktop';

const DEVICE_PRESETS = {
  mobile: { name: 'Mobile', width: 375, height: 667, icon: Smartphone },
  tablet: { name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  desktop: { name: 'Desktop', width: 1280, height: 800, icon: Monitor },
};

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
  const [previewMode] = useState<'authenticated' | 'guest'>('guest');
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('mobile');
  
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
      // TODO: Convert videoBlob to GIF
      // For now, pass the video blob directly
      onRecordingComplete(videoBlob);
    }
  };

  const handleDiscard = () => {
    reset();
  };

  // Build iframe URL with preview mode parameter (kept for reference, but not used for capture)
  const iframeUrl = previewMode === 'guest' 
    ? `${targetPath}${targetPath.includes('?') ? '&' : '?'}_preview_auth=false`
    : targetPath;

  const openSizedWindow = () => {
    const { width, height } = DEVICE_PRESETS[devicePreset];
    const features = `width=${width},height=${height},resizable=no,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`;
    window.open(iframeUrl, 'nuacha-preview', features);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
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
          <div className="flex-1 relative border border-border rounded-lg overflow-hidden bg-muted p-6 flex flex-col justify-center">
            
            {/* State: Idle (no recording yet) */}
            {!isRecording && !hasRecording && (
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">Ready to Record</h3>
                  
                  {/* Device preset selector */}
                  <div className="flex justify-center gap-2">
                    {Object.entries(DEVICE_PRESETS).map(([key, preset]) => {
                      const Icon = preset.icon;
                      return (
                        <Button
                          key={key}
                          variant={devicePreset === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDevicePreset(key as DevicePreset)}
                          className="gap-2"
                        >
                          <Icon className="w-4 h-4" />
                          {preset.name}
                          <span className="text-xs opacity-70">{preset.width}×{preset.height}</span>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Open in sized window button */}
                  <Button onClick={openSizedWindow} variant="outline" size="lg" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open at {DEVICE_PRESETS[devicePreset].name} Size ({DEVICE_PRESETS[devicePreset].width}×{DEVICE_PRESETS[devicePreset].height})
                  </Button>
                </div>

                {/* Instructions for popup window workflow */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-left">
                  <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    📐 Recording at {DEVICE_PRESETS[devicePreset].name} size ({DEVICE_PRESETS[devicePreset].width} × {DEVICE_PRESETS[devicePreset].height}px)
                  </p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Click "Open at {DEVICE_PRESETS[devicePreset].name} Size" above to open a popup window at exact dimensions</li>
                    <li>Interact with the popup to set up the desired UI state</li>
                    <li>Click "Start Recording" below</li>
                    <li>When prompted, select the <strong>popup window</strong> (not the main browser)</li>
                    <li>Record your interaction, then click "Stop Recording"</li>
                  </ol>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border text-left space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What to capture:</p>
                  <p className="text-sm">{screenshotHint || stepDescription}</p>
                </div>

                <Button onClick={handleStart} size="lg" className="gap-2">
                  <Circle className="w-4 h-4 fill-current" />
                  Start Recording
                </Button>
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
                    This is the video that will be converted to a GIF and added to the learning step.
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
                  Note: Video will be converted to GIF format when saved.
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
