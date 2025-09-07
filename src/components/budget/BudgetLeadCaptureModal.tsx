import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BudgetLeadCaptureForm, { BudgetLeadCaptureData } from "./BudgetLeadCaptureForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BudgetLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

export default function BudgetLeadCaptureModal({ 
  open, 
  onOpenChange 
}: BudgetLeadCaptureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(data: BudgetLeadCaptureData) {
    setIsLoading(true);
    
    toast.success("Thank you for your interest!", {
      description: "Redirecting you to sign up to unlock custom budget features.",
    });

    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      navigate("/signup?from=budget-demo");
    }, 700);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="mb-1 text-center">Unlock Custom Budget Features</DialogTitle>
          <DialogDescription className="mb-5 text-center">
            To add custom unpaid labor categories, we'd love to learn more about your household budget needs.<br />
            <span className="text-xs text-muted-foreground">(It helps us improve! Takes just a few seconds.)</span>
          </DialogDescription>
        </DialogHeader>
        <BudgetLeadCaptureForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}