import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PayrollLeadCaptureForm, { PayrollLeadCaptureData } from "./PayrollLeadCaptureForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PayrollLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  actionType: 'save' | 'load' | 'export' | 'create_period' | 'advanced_features';
}

export default function PayrollLeadCaptureModal({ 
  open, 
  onOpenChange, 
  actionType 
}: PayrollLeadCaptureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const actionMessages = {
    save: "save payroll calculations",
    load: "load saved calculations", 
    export: "export payroll data",
    create_period: "create payroll periods",
    advanced_features: "access advanced payroll features"
  };

  function handleSubmit(data: PayrollLeadCaptureData) {
    setIsLoading(true);
    
    toast.success("Thank you for your interest!", {
      description: "Redirecting you to sign up to unlock payroll features.",
    });

    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      navigate("/signup?from=payroll-demo");
    }, 700);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="mb-1 text-center">Unlock Payroll Features</DialogTitle>
          <DialogDescription className="mb-5 text-center">
            To {actionMessages[actionType]}, we'd love to learn more about your payroll needs.<br />
            <span className="text-xs text-muted-foreground">(It helps us improve! Takes just a few seconds.)</span>
          </DialogDescription>
        </DialogHeader>
        <PayrollLeadCaptureForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}