
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthDemoLeadCaptureForm, { AuthDemoLeadCaptureData } from "./AuthDemoLeadCaptureForm";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthDemoLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

export default function AuthDemoLeadCaptureModal({ open, onOpenChange }: AuthDemoLeadCaptureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(data: AuthDemoLeadCaptureData) {
    setIsLoading(true);
    toast({
      title: "Thank you!",
      description: "Your interest is noted. Redirecting you to sign up.",
    });

    // Perform navigation before closing the modal
    setTimeout(() => {
      console.log("Navigating to /signup?from=auth-demo from AuthDemoLeadCaptureModal");
      navigate("/signup?from=auth-demo");
      // Delay closing modal slightly to allow route transition
      setTimeout(() => {
        setIsLoading(false);
        onOpenChange(false);
      }, 150);
    }, 700);
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

