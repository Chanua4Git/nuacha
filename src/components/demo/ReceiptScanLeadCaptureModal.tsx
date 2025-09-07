import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReceiptScanLeadCaptureForm, { ReceiptScanLeadCaptureData } from "./ReceiptScanLeadCaptureForm";
import { toast } from "sonner";
import { CheckCircle, Sparkles } from "lucide-react";

interface ReceiptScanLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onComplete: () => void;
}

export default function ReceiptScanLeadCaptureModal({ 
  open, 
  onOpenChange,
  onComplete 
}: ReceiptScanLeadCaptureModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(data: ReceiptScanLeadCaptureData) {
    setIsLoading(true);
    
    toast.success("Thank you for your interest!", {
      description: "Now let's show you what our OCR technology found...",
      icon: <CheckCircle className="h-4 w-4" />
    });

    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      onComplete();
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="mb-1 text-center flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your Receipt Was Scanned Perfectly!
          </DialogTitle>
          <DialogDescription className="mb-5 text-center">
            🎉 Our OCR technology extracted all the details automatically. Before we show you the amazing results, we'd love to understand your needs better.<br />
            <span className="text-xs text-muted-foreground">(This helps us improve! Takes just 30 seconds.)</span>
          </DialogDescription>
        </DialogHeader>
        <ReceiptScanLeadCaptureForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}