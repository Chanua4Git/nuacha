
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthDemoLeadCaptureForm, { AuthDemoLeadCaptureData } from "./AuthDemoLeadCaptureForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AuthDemoService } from "@/auth/services/AuthDemoService";
import { setAuthDemoActive } from "@/auth/utils/authDemoHelpers";

interface AuthDemoLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

export default function AuthDemoLeadCaptureModal({ open, onOpenChange }: AuthDemoLeadCaptureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(data: AuthDemoLeadCaptureData) {
    setIsLoading(true);
    
    // Set auth demo mode active
    setAuthDemoActive();
    
    // Store the email for the demo flow
    AuthDemoService.setDemoEmail(data.email);
    
    toast.success("Thank you!", {
      description: "Your interest is noted. Redirecting you to sign up.",
    });

    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      // Use AuthDemoService to get the proper signup URL with demo context
      navigate(AuthDemoService.getSignupUrl());
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
