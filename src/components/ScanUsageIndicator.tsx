import { Scan, Infinity as InfinityIcon, Sparkles, HardDrive } from 'lucide-react';
import { useScanUsageTracker } from '@/hooks/useScanUsageTracker';

export function ScanUsageIndicator() {
  const { 
    getRemainingScans, 
    dailyLimit, 
    hasUnlimitedScans, 
    isCheckingSubscription,
    getBlockedReason,
    storagePercentUsed
  } = useScanUsageTracker();
  
  if (isCheckingSubscription) {
    return null;
  }

  const remaining = getRemainingScans();
  const blockedReason = getBlockedReason();

  // Show unlimited badge for subscribers with storage space
  if (hasUnlimitedScans && !blockedReason) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary bg-soft-green/30 px-3 py-1.5 rounded-full">
        <InfinityIcon className="h-4 w-4" />
        <span className="font-medium">Unlimited scans</span>
        <span className="text-muted-foreground text-xs">({Math.round(storagePercentUsed)}% storage used)</span>
      </div>
    );
  }

  // Storage full for paid users
  if (blockedReason === 'storage_full') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blush/50 px-3 py-1.5 rounded-full">
        <HardDrive className="h-4 w-4" />
        <span>Storage full - upgrade for more space</span>
      </div>
    );
  }

  // Free user hit daily limit
  if (remaining === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blush/50 px-3 py-1.5 rounded-full">
        <Scan className="h-4 w-4" />
        <span>No free scans left today</span>
      </div>
    );
  }

  // Running low on free scans
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

  // Normal free tier indicator
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-soft-green/20 px-3 py-1.5 rounded-full">
      <Scan className="h-4 w-4 text-primary" />
      <span>
        <span className="font-medium text-foreground">{dailyLimit}</span> free scans today
      </span>
    </div>
  );
}
