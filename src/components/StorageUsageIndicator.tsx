import { HardDrive, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StorageUsageIndicatorProps {
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function StorageUsageIndicator({ 
  showUpgradeButton = true, 
  compact = false 
}: StorageUsageIndicatorProps) {
  const navigate = useNavigate();
  const { 
    formattedUsed, 
    formattedLimit, 
    percentUsed, 
    isNearLimit, 
    isAtLimit,
    isLoading 
  } = useStorageUsage();

  if (isLoading) {
    return null;
  }

  // Determine color based on usage
  const getProgressColor = () => {
    if (isAtLimit) return 'bg-destructive';
    if (isNearLimit) return 'bg-amber-500';
    return 'bg-primary';
  };

  const getBackgroundColor = () => {
    if (isAtLimit) return 'bg-destructive/10';
    if (isNearLimit) return 'bg-amber-500/10';
    return 'bg-soft-green/30';
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm px-3 py-1.5 rounded-full",
        getBackgroundColor()
      )}>
        <HardDrive className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">
          {formattedUsed} / {formattedLimit}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg p-4 border",
      isAtLimit ? "border-destructive/30 bg-destructive/5" :
      isNearLimit ? "border-amber-500/30 bg-amber-500/5" :
      "border-border bg-card"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className={cn(
            "h-4 w-4",
            isAtLimit ? "text-destructive" :
            isNearLimit ? "text-amber-500" :
            "text-primary"
          )} />
          <span className="text-sm font-medium text-foreground">Storage</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formattedUsed} of {formattedLimit}
        </span>
      </div>

      <Progress 
        value={percentUsed} 
        className="h-2 mb-2"
        indicatorClassName={getProgressColor()}
      />

      {isAtLimit && (
        <div className="flex items-start gap-2 mt-3 p-2 bg-destructive/10 rounded-md">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Storage almost full</p>
            <p className="text-muted-foreground">Upgrade your plan to continue scanning receipts.</p>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="flex items-start gap-2 mt-3 p-2 bg-amber-500/10 rounded-md">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">Running low on storage</p>
            <p className="text-muted-foreground">Consider upgrading for more space.</p>
          </div>
        </div>
      )}

      {showUpgradeButton && (isNearLimit || isAtLimit) && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => navigate('/get-started')}
        >
          Upgrade Plan
          <ArrowUpRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
