import { Scan, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { useScanUsageTracker } from '@/hooks/useScanUsageTracker';

export function ScanUsageIndicator() {
  const { getRemainingScans, dailyLimit, hasUnlimitedScans, isCheckingSubscription } = useScanUsageTracker();
  
  if (isCheckingSubscription) {
    return null; // Don't show while loading
  }

  const remaining = getRemainingScans();

  // Show unlimited badge for subscribers
  if (hasUnlimitedScans) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary bg-soft-green/30 px-3 py-1.5 rounded-full">
        <InfinityIcon className="h-4 w-4" />
        <span className="font-medium">Unlimited scans</span>
      </div>
    );
  }

  if (remaining === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blush/50 px-3 py-1.5 rounded-full">
        <Scan className="h-4 w-4" />
        <span>No free scans left today</span>
      </div>
    );
  }

  if (remaining <= 2) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 px-3 py-1.5 rounded-full">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>
          <span className="font-medium text-foreground">{remaining}</span> of {dailyLimit} free scans left
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-soft-green/20 px-3 py-1.5 rounded-full">
      <Scan className="h-4 w-4 text-primary" />
      <span>
        <span className="font-medium text-foreground">{dailyLimit}</span> free scans today
      </span>
    </div>
  );
}
