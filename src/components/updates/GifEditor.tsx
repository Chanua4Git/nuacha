import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Scissors, Zap, Save, X, Play, Pause, RotateCcw } from 'lucide-react';

interface GifEditorProps {
  open: boolean;
  gifBlob: Blob;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

export function GifEditor({ open, gifBlob, onSave, onCancel }: GifEditorProps) {
  const [gifUrl, setGifUrl] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [gifKey, setGifKey] = useState<number>(0);
  const [fileSize, setFileSize] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (gifBlob) {
      const url = URL.createObjectURL(gifBlob);
      setGifUrl(url);
      
      // Calculate file size
      const sizeInMB = (gifBlob.size / (1024 * 1024)).toFixed(2);
      setFileSize(`${sizeInMB} MB`);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [gifBlob]);

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

  const handleSave = () => {
    // For v1, we'll just save the original blob
    // Future enhancement: implement actual trimming and speed adjustment
    onSave(gifBlob);
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
                <img
                  key={gifKey}
                  ref={imgRef}
                  src={gifUrl}
                  alt="GIF preview"
                  className="max-h-96 rounded"
                />
              ) : (
                <div className="flex items-center justify-center max-h-96 text-muted-foreground">
                  GIF paused
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
            <Label className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Trim Duration
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-16">Start:</span>
                <Slider
                  value={[trimStart]}
                  onValueChange={(value) => setTrimStart(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{trimStart}%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-16">End:</span>
                <Slider
                  value={[trimEnd]}
                  onValueChange={(value) => setTrimEnd(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{trimEnd}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Trimming will be applied in future version
            </p>
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
