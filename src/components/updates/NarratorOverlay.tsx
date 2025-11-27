import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NarratorDisplayMode } from '@/constants/learningCenterData';

interface NarratorOverlayProps {
  videoUrl: string;
  displayMode: NarratorDisplayMode;
  className?: string;
}

export function NarratorOverlay({ videoUrl, displayMode, className }: NarratorOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Ensure video plays when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [videoUrl]);

  if (displayMode === 'disabled') {
    return null;
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Voice-only mode: hidden video element
  if (displayMode === 'voice-only') {
    return (
      <div className={cn("relative", className)}>
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          className="hidden"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 rounded-full shadow-lg"
          title={isMuted ? 'Unmute narrator' : 'Mute narrator'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  // Face + Voice mode: circular bubble overlay
  return (
    <div className={cn("absolute bottom-3 right-3 z-10 group", className)}>
      <div className="relative w-20 h-20 md:w-24 md:h-24">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover rounded-full border-2 border-white shadow-lg"
        />
        
        {/* Mute toggle button - appears on hover */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="absolute top-0 right-0 h-6 w-6 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity shadow"
          title={isMuted ? 'Unmute narrator' : 'Mute narrator'}
        >
          {isMuted ? (
            <VolumeX className="w-3 h-3" />
          ) : (
            <Volume2 className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}
