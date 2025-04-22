
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthDemoLeadCaptureForm, { AuthDemoLeadCaptureData } from "./AuthDemoLeadCaptureForm";
import { toast } from "@/hooks/use-toast";

interface AuthDemoLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onComplete?: () => void; // new prop
}

export default function AuthDemoLeadCaptureModal({ open, onOpenChange, onComplete }: AuthDemoLeadCaptureModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(data: AuthDemoLeadCaptureData) {
    setIsLoading(true);
    toast({
      title: "Thank you!",
      description: "Your interest is noted. Redirecting you to sign up.",
    });

    // Call onComplete first, then close modal
    if (onComplete) {
      onComplete();
    }
    
    // Small delay before closing the modal to allow navigation to trigger
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="mb-1 text-center">Start Your Authentication Journey</DialogTitle>
          <DialogDescription className="mb-5 text-center">
            Before you sign up, we'd love to understand what brings you to Nuacha's authentication demo.<br />
            <span className="text-xs text-muted-foreground">(It helps us improve! Takes just a few seconds.)</span>
          </DialogDescription>
        </DialogHeader>
        <AuthDemoLeadCaptureForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
