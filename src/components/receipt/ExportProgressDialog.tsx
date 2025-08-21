import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, X } from 'lucide-react';

interface ExportProgress {
  current: number;
  total: number;
  status: string;
}

interface ExportProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ExportProgress | null;
  isComplete: boolean;
  isError: boolean;
  errorMessage?: string;
}

const ExportProgressDialog: React.FC<ExportProgressDialogProps> = ({
  isOpen,
  onClose,
  progress,
  isComplete,
  isError,
  errorMessage
}) => {
  const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Export Complete
              </>
            ) : isError ? (
              <>
                <X className="h-5 w-5 text-red-600" />
                Export Failed
              </>
            ) : (
              <>
                <Download className="h-5 w-5 text-primary" />
                Exporting Receipts
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isError ? (
            <div className="text-center space-y-4">
              <div className="text-red-600 text-sm">
                {errorMessage || 'An error occurred during export'}
              </div>
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          ) : isComplete ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-sm">
                Your receipts have been exported successfully. The download should start automatically.
              </div>
              <Button onClick={onClose} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {progress && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{progress.status}</span>
                      <span>{progress.current} / {progress.total}</span>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center">
                    {Math.round(progressPercentage)}% complete
                  </div>
                </>
              )}
              
              <div className="text-xs text-muted-foreground text-center">
                Please wait while we prepare your export. This may take a few moments for large collections.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportProgressDialog;