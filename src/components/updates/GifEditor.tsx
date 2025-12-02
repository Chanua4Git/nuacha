import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Scissors, Zap, Save, X, Play, Pause, RotateCcw, Smartphone, RotateCw } from 'lucide-react';
import { useVideoTrimmer } from '@/hooks/useVideoTrimmer';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Internal mobile presets - no props needed
const MOBILE_PRESETS = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667 },
  { id: 'iphone-12', label: 'iPhone 12/13/14', width: 390, height: 844 },
  { id: 'iphone-14-max', label: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { id: 'android-sm', label: 'Android Small', width: 360, height: 640 },
  { id: 'android-lg', label: 'Android Large', width: 412, height: 915 },
];

type MobilePreset = typeof MOBILE_PRESETS[number];

// Crop position options for Fill mode
const CROP_POSITIONS = [
  { id: 'top-left', label: '↖', x: 0, y: 0 },
  { id: 'top-center', label: '↑', x: 0.5, y: 0 },
  { id: 'top-right', label: '↗', x: 1, y: 0 },
  { id: 'center-left', label: '←', x: 0, y: 0.5 },
  { id: 'center', label: '●', x: 0.5, y: 0.5 },
  { id: 'center-right', label: '→', x: 1, y: 0.5 },
  { id: 'bottom-left', label: '↙', x: 0, y: 1 },
  { id: 'bottom-center', label: '↓', x: 0.5, y: 1 },
  { id: 'bottom-right', label: '↘', x: 1, y: 1 },
] as const;

type CropPosition = typeof CROP_POSITIONS[number];
type MobileMode = 'fit' | 'fill';

interface GifEditorProps {
  open: boolean;
  gifBlob: Blob;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

// Helper to build FIT filter (scale to fit, add padding)
const buildFitFilter = (width: number, height: number): string => {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(${width}-iw)/2:(${height}-ih)/2:color=black`;
};

// Helper to build FILL filter (scale to cover, then crop with position)
const buildFillFilter = (width: number, height: number, cropPos: CropPosition): string => {
  return `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:(in_w-${width})*${cropPos.x}:(in_h-${height})*${cropPos.y}`;
};

export function GifEditor({ open, gifBlob, onSave, onCancel }: GifEditorProps) {
  const [gifUrl, setGifUrl] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [gifKey, setGifKey] = useState<number>(0);
  const [fileSize, setFileSize] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  
  // Track original and current blob for reset functionality
  const [originalBlob, setOriginalBlob] = useState<Blob>(gifBlob);
  const [currentBlob, setCurrentBlob] = useState<Blob>(gifBlob);
  const [isTrimmed, setIsTrimmed] = useState<boolean>(false);
  
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropProgress, setCropProgress] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<MobilePreset | null>(null);
  
  // Fit/Fill mode state
  const [mobileMode, setMobileMode] = useState<MobileMode>('fill');
  // Crop position state (default: top-center since most UI is near top)
  const [cropPosition, setCropPosition] = useState<CropPosition>(CROP_POSITIONS[1]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const { trimVideo, isLoading: isTrimming, progress } = useVideoTrimmer();

  // Reset state when input blob changes (new recording)
  useEffect(() => {
    setOriginalBlob(gifBlob);
    setCurrentBlob(gifBlob);
    setIsTrimmed(false);
    setTrimStart(0);
    setTrimEnd(100);
    setSelectedPreset(null);
  }, [gifBlob]);

  useEffect(() => {
    if (currentBlob) {
      const url = URL.createObjectURL(currentBlob);
      setGifUrl(url);
      
      // Calculate file size
      const sizeInMB = (currentBlob.size / (1024 * 1024)).toFixed(2);
      setFileSize(`${sizeInMB} MB`);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [currentBlob]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setGifKey(prev => prev + 1);
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    setGifKey(prev => prev + 1);
    setIsPlaying(true);
  };

  async function handleApplyTrim() {
    if (!videoDuration) {
      toast.error('Video duration not loaded yet');
      return;
    }

    const startTime = (trimStart / 100) * videoDuration;
    const endTime = (trimEnd / 100) * videoDuration;

    if (startTime >= endTime) {
      toast.error('Start time must be before end time');
      return;
    }

    try {
      const trimmedBlob = await trimVideo(currentBlob, startTime, endTime);
      setCurrentBlob(trimmedBlob);
      setIsTrimmed(true);
      toast.success('Trim applied! Review the result.');
    } catch (error) {
      // Error already toasted in hook
    }
  }

  const handleResetTrim = () => {
    setCurrentBlob(originalBlob);
    setIsTrimmed(false);
    setTrimStart(0);
    setTrimEnd(100);
    setSelectedPreset(null);
    toast.info('Reset to original recording');
  };

  const handleSave = () => {
    // Save whatever the current blob is (includes all trims/crops applied)
    onSave(currentBlob);
  };

  const handleCropToPreset = async (preset: MobilePreset) => {
    setIsCropping(true);
    setCropProgress(0);
    setSelectedPreset(preset);

    try {
      // Load FFmpeg if not already loaded
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        
        ffmpeg.on('log', ({ message }) => {
          console.log('FFmpeg:', message);
        });

        ffmpeg.on('progress', ({ progress }) => {
          setCropProgress(Math.round(progress * 100));
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegRef.current = ffmpeg;
      }

      const ffmpeg = ffmpegRef.current;
      const { width, height } = preset;

      // Determine input file extension based on blob type
      const inputExt = currentBlob.type === 'video/mp4' ? 'mp4' : 'webm';
      const inputFile = `input.${inputExt}`;

      // Write input file
      await ffmpeg.writeFile(inputFile, await fetchFile(currentBlob));

      // TWO-PASS MEMORY-SAFE PROCESSING
      // Pass 1: Downsample to max 1280px wide first (reduces memory pressure significantly)
      console.log('Pass 1: Downsampling to 1280px wide...');
      await ffmpeg.exec([
        '-i', inputFile,
        '-vf', 'scale=1280:-2',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-threads', '1',
        'intermediate.mp4'
      ]);

      // Pass 2: Apply Fit or Fill based on selected mode
      const filterString = mobileMode === 'fit'
        ? buildFitFilter(width, height)
        : buildFillFilter(width, height, cropPosition);
      
      console.log(`Pass 2: Applying ${mobileMode} filter to ${width}x${height}...`);
      await ffmpeg.exec([
        '-i', 'intermediate.mp4',
        '-vf', filterString,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-threads', '1',
        'output.mp4'
      ]);

      // Read output
      const data = await ffmpeg.readFile('output.mp4');
      const croppedBlob = new Blob(
        [data instanceof Uint8Array ? data : new Uint8Array(data as any)], 
        { type: 'video/mp4' }
      );

      // Clean up all files
      await ffmpeg.deleteFile(inputFile);
      await ffmpeg.deleteFile('intermediate.mp4');
      await ffmpeg.deleteFile('output.mp4');

      setCurrentBlob(croppedBlob);
      const modeLabel = mobileMode === 'fit' ? 'fitted' : 'cropped';
      toast.success(`Video ${modeLabel} to ${preset.label} (${width}×${height})!`);
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to process video. Try trimming first to reduce size.');
    } finally {
      setIsCropping(false);
      setCropProgress(0);
    }
  };

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' }
  ];

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your GIF</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preview</Label>
              {fileSize && (
                <span className="text-xs text-muted-foreground">File size: {fileSize}</span>
              )}
            </div>
            <div className="relative flex justify-center border border-border rounded-lg bg-muted p-4">
              {isPlaying ? (
                <video
                  ref={videoRef}
                  key={gifKey}
                  src={gifUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  className="max-h-96 rounded"
                />
              ) : (
                <div className="flex items-center justify-center max-h-96 text-muted-foreground">
                  Video paused
                </div>
              )}
              
              {/* Playback controls overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={togglePlayPause}
                  className="shadow-lg"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReplay}
                  className="shadow-lg"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Replay
                </Button>
              </div>
            </div>
          </div>

          {/* Speed Control */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Playback Speed
            </Label>
            <div className="flex items-center gap-4">
              {speedOptions.map(option => (
                <Button
                  key={option.value}
                  variant={speed === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSpeed(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Speed adjustment will be applied in future version
            </p>
          </div>

          {/* Trim Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Trim Duration
              </Label>
              {videoDuration > 0 && (
                <span className="text-xs text-muted-foreground">
                  Duration: {videoDuration.toFixed(1)}s
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-16">Start:</span>
                <Slider
                  value={[trimStart]}
                  onValueChange={(value) => setTrimStart(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={isTrimming}
                />
                <span className="text-sm font-medium w-16">
                  {videoDuration > 0 
                    ? `${((trimStart / 100) * videoDuration).toFixed(1)}s`
                    : `${trimStart}%`
                  }
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-16">End:</span>
                <Slider
                  value={[trimEnd]}
                  onValueChange={(value) => setTrimEnd(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={isTrimming}
                />
                <span className="text-sm font-medium w-16">
                  {videoDuration > 0 
                    ? `${((trimEnd / 100) * videoDuration).toFixed(1)}s`
                    : `${trimEnd}%`
                  }
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={handleApplyTrim} 
                disabled={isTrimming || !videoDuration}
                size="sm"
                variant="secondary"
              >
                {isTrimming ? `Processing... ${progress}%` : 'Apply Trim'}
              </Button>
              {(isTrimmed || selectedPreset) && (
                <Button
                  onClick={handleResetTrim}
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  Reset to Original
                </Button>
              )}
              {isTrimming && (
                <span className="text-xs text-muted-foreground">This may take a moment...</span>
              )}
            </div>
          </div>

          {/* Mobile Output Mode */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Mobile Output Mode
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant={mobileMode === 'fit' ? 'default' : 'outline'}
                onClick={() => setMobileMode('fit')}
                size="sm"
                className="flex-1"
              >
                Fit (no crop)
              </Button>
              <Button
                variant={mobileMode === 'fill' ? 'default' : 'outline'}
                onClick={() => setMobileMode('fill')}
                size="sm"
                className="flex-1"
              >
                Fill (crop edges)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {mobileMode === 'fit' 
                ? 'Keeps all content visible. May add black bars on sides if aspect ratios differ.'
                : 'Fills the mobile frame completely. May cut off left/right or top/bottom edges.'}
            </p>
          </div>

          {/* Crop Focus Control - Only visible in Fill mode */}
          {mobileMode === 'fill' && (
            <div className="space-y-3">
              <Label>Crop Focus</Label>
              <p className="text-xs text-muted-foreground">
                Choose which part of the screen to keep when cropping
              </p>
              <div className="grid grid-cols-3 gap-1 w-fit">
                {CROP_POSITIONS.map((pos) => (
                  <Button
                    key={pos.id}
                    variant={cropPosition.id === pos.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCropPosition(pos)}
                    className="w-10 h-10 p-0 text-lg"
                    title={pos.id.replace('-', ' ')}
                  >
                    {pos.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Crop Presets */}
          <div className="space-y-3">
            <Label>Crop to Mobile Size</Label>
            <p className="text-xs text-muted-foreground">
              Click a preset to apply the selected output mode ({mobileMode === 'fit' ? 'Fit' : 'Fill'}).
            </p>
            <div className="flex flex-wrap gap-2">
              {MOBILE_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedPreset?.id === preset.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCropToPreset(preset)}
                  disabled={isCropping}
                >
                  {preset.label}
                  <span className="text-xs opacity-70 ml-1">({preset.width}×{preset.height})</span>
                </Button>
              ))}
            </div>
            {isCropping && (
              <p className="text-xs text-muted-foreground">Processing… {cropProgress}% (this may take a few seconds)</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save GIF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}