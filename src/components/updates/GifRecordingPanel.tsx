import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, Square, ChevronRight, ChevronLeft, Film, Smartphone, Tablet, Monitor, ExternalLink } from 'lucide-react';
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
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('mobile');
  const [previewMode, setPreviewMode] = useState<'guest' | 'authenticated'>('guest');
  
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
      // Pass iframe dimensions for crop reference
      const { width, height } = DEVICE_PRESETS[devicePreset];
      // Store device preset in blob for later crop reference
      (videoBlob as any).deviceWidth = width;
      (videoBlob as any).deviceHeight = height;
      onRecordingComplete(videoBlob);
    }
  };

  const handleDiscard = () => {
    reset();
  };

  // Build iframe URL based on preview mode
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
              <div className="w-full space-y-6">
                <div className="space-y-3 text-center">
                  <h3 className="text-xl font-semibold">Ready to Record</h3>
                  <p className="text-sm text-muted-foreground">
                    This will record your screen. Follow the steps below to capture your learning demonstration.
                  </p>
                  
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

                  {/* Preview Mode Toggle */}
                  <div className="flex justify-center gap-2">
                    <Button
                      variant={previewMode === 'guest' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('guest')}
                    >
                      👤 Guest View
                    </Button>
                    <Button
                      variant={previewMode === 'authenticated' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('authenticated')}
                    >
                      🔐 Authenticated View
                    </Button>
                  </div>

                  {previewMode === 'guest' && (
                    <div className="text-xs text-center text-amber-600 space-y-1">
                      <p>⚠️ <strong>For true guest view:</strong> Open the preview URL in an <strong>Incognito/Private window</strong> or a different browser where you're not logged in.</p>
                      <p className="text-muted-foreground">The Guest View toggle only works for components using useAuthPreview().</p>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="max-w-2xl mx-auto p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3 text-left">
                  <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    🎬 Recording Workflow
                  </p>
                  <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Click <strong>"Open Preview Window"</strong> below to open the target page</li>
                    <li><strong>In the preview tab, open DevTools (F12)</strong> and click the device toggle icon 📱 to enable responsive mode</li>
                    <li>Select your device size (e.g., "iPhone 12 Pro" for 390×844) or set custom dimensions</li>
                    <li>Arrange and interact with the preview to set up your desired UI state</li>
                    <li>Return to this admin page and click <strong>"Start Recording"</strong></li>
                    <li>In Chrome's picker, <strong className="text-red-700">select the preview tab</strong> (NOT this admin tab)</li>
                    <li>Interact with the preview to demonstrate the feature, then click <strong>"Stop Recording"</strong></li>
                  </ol>
                  
                  {/* Keyboard shortcuts reference */}
                  <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-blue-200">
                    <span className="bg-white px-2 py-1 rounded text-xs text-blue-900">
                      📱 DevTools: <kbd className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">F12</kbd> then <kbd className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Cmd+Shift+M</kbd>
                    </span>
                    <span className="bg-white px-2 py-1 rounded text-xs text-blue-900">
                      🥷 Incognito: <kbd className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Cmd+Shift+N</kbd>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border text-left space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What to capture:</p>
                  <p className="text-sm">{screenshotHint || stepDescription}</p>
                </div>

                {/* Open Preview Window button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.open(iframeUrl, '_blank')}
                    size="lg"
                    variant="outline"
                    className="gap-2 flex-col h-auto py-3"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Open Preview Window
                    </span>
                    <span className="text-xs opacity-70 font-normal">(then use DevTools for sizing)</span>
                  </Button>
                </div>

                {/* Start recording button */}
                <Button onClick={handleStart} size="lg" className="w-full gap-2">
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
