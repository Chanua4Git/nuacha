import { Scan } from 'lucide-react';
import { useScanUsageTracker } from '@/hooks/useScanUsageTracker';

export function ScanUsageIndicator() {
  const { getRemainingScans, dailyLimit } = useScanUsageTracker();
  const remaining = getRemainingScans();

  if (remaining === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
        <Scan className="h-4 w-4" />
        <span>No free scans left today</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/30 px-3 py-1.5 rounded-full">
      <Scan className="h-4 w-4 text-primary" />
      <span>
        <span className="font-medium text-foreground">{remaining}</span> of {dailyLimit} free scans today
      </span>
    </div>
  );
}
