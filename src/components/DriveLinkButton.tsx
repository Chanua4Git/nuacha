import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface DriveLinkButtonProps {
  driveUrl?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DriveLinkButton({ driveUrl, variant = 'outline', size = 'sm' }: DriveLinkButtonProps) {
  if (!driveUrl) return null;
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.open(driveUrl, '_blank')}
      className="gap-2"
    >
      <ExternalLink className="h-4 w-4" />
      View in Drive
    </Button>
  );
}
