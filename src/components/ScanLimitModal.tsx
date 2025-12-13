import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScanLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeUntilReset: string;
}

export function ScanLimitModal({ open, onOpenChange, timeUntilReset }: ScanLimitModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/get-started');
  };

  const handleWait = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl text-center">
            You've used your free scans today
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Great job tracking your expenses! You've used all 3 free scans for today.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upgrade Option */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Upgrade for unlimited scans</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get unlimited receipt scanning, family expense tracking, budgeting tools, and more.
            </p>
            <Button 
              onClick={handleUpgrade} 
              className="w-full"
              size="lg"
            >
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Wait Option */}
          <div className="bg-muted/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-muted p-2 rounded-full">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">Come back tomorrow</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Your free scans reset in <span className="font-semibold text-foreground">{timeUntilReset}</span>
            </p>
            <Button 
              variant="outline" 
              onClick={handleWait}
              className="w-full"
            >
              I'll wait, thanks
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          You can still enter expenses manually while you wait.
        </p>
      </DialogContent>
    </Dialog>
  );
}
