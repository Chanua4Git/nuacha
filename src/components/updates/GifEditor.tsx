import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Scissors, Zap, Save, X, Play, Pause, RotateCcw, Crop } from 'lucide-react';
import { useVideoTrimmer } from '@/hooks/useVideoTrimmer';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface GifEditorProps {
  open: boolean;
  gifBlob: Blob;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
  deviceWidth?: number;
  deviceHeight?: number;
}

export function GifEditor({ open, gifBlob, onSave, onCancel, deviceWidth, deviceHeight }: GifEditorProps) {
  const [gifUrl, setGifUrl] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [gifKey, setGifKey] = useState<number>(0);
  const [fileSize, setFileSize] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentBlob, setCurrentBlob] = useState<Blob>(gifBlob);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropProgress, setCropProgress] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const { trimVideo, isLoading: isTrimming, progress } = useVideoTrimmer();

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
      toast.success('Trim applied! Review the result.');
    } catch (error) {
      // Error already toasted in hook
    }
  }

  const handleSave = () => {
    onSave(currentBlob);
  };

  const handleCropToMobile = async () => {
    if (!deviceWidth || !deviceHeight) {
      toast.error('No device dimensions provided for cropping');
      return;
    }

    setIsCropping(true);
    setCropProgress(0);

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

      // Write input file
      await ffmpeg.writeFile('input.webm', await fetchFile(currentBlob));

      // Crop to mobile dimensions (center crop)
      // We'll crop from center of video to mobile dimensions
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-vf', `crop=${deviceWidth}:${deviceHeight}`,
        '-c:v', 'libvpx-vp9',
        '-preset', 'fast',
        'output.webm'
      ]);

      // Read output
      const data = await ffmpeg.readFile('output.webm');
      const croppedBlob = new Blob(
        [data instanceof Uint8Array ? data : new Uint8Array(data as any)], 
        { type: 'video/webm' }
      );

      // Clean up
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.webm');

      setCurrentBlob(croppedBlob);
      toast.success('Video cropped to mobile dimensions!');
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to crop video. Please try again.');
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
      <DialogContent className="max-w-4xl">
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
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleApplyTrim} 
                disabled={isTrimming || !videoDuration}
                size="sm"
                variant="secondary"
              >
                {isTrimming ? `Processing... ${progress}%` : 'Apply Trim'}
              </Button>
              {isTrimming && (
                <span className="text-xs text-muted-foreground">This may take a moment...</span>
              )}
            </div>
          </div>

          {/* Crop Control */}
          {deviceWidth && deviceHeight && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Crop className="w-4 h-4" />
                Crop to Mobile Size
              </Label>
              <p className="text-xs text-muted-foreground">
                Crops the video to {deviceWidth}×{deviceHeight}px (mobile preview area)
              </p>
              <Button 
                onClick={handleCropToMobile} 
                disabled={isCropping}
                size="sm"
                variant="secondary"
                className="gap-2"
              >
                <Crop className="w-4 h-4" />
                {isCropping ? `Cropping... ${cropProgress}%` : `Crop to Mobile (${deviceWidth}×${deviceHeight})`}
              </Button>
              {isCropping && (
                <span className="text-xs text-muted-foreground">This may take a moment...</span>
              )}
            </div>
          )}
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
