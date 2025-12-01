import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Film } from 'lucide-react';

interface VideoCompressionProgressProps {
  originalSizeMB: number;
  estimatedSizeMB: number;
  progress: number;
  stage: 'analyzing' | 'compressing' | 'finalizing';
}

export function VideoCompressionProgress({
  originalSizeMB,
  estimatedSizeMB,
  progress,
  stage
}: VideoCompressionProgressProps) {
  const stageLabels = {
    analyzing: 'Analyzing video...',
    compressing: 'Compressing video stream...',
    finalizing: 'Finalizing...'
  };

  const estimatedTimeRemaining = progress > 10 
    ? Math.max(5, Math.round((100 - progress) / 5))
    : null;

  return (
    <Card className="p-6 space-y-4 bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3">
        <Film className="w-6 h-6 text-primary animate-pulse" />
        <h3 className="text-lg font-semibold">Compressing Video</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Original:</span>
          <span className="font-medium">{originalSizeMB.toFixed(1)} MB</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Target:</span>
          <span className="font-medium text-primary">~{estimatedSizeMB.toFixed(1)} MB</span>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{stageLabels[stage]}</span>
          <span className="font-medium">{progress}%</span>
        </div>
      </div>

      {estimatedTimeRemaining && (
        <p className="text-xs text-muted-foreground text-center">
          Estimated: ~{estimatedTimeRemaining} seconds remaining
        </p>
      )}
    </Card>
  );
}
