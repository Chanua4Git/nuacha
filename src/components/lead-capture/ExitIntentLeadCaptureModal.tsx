import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExitIntentLeadCaptureForm, { ExitIntentLeadCaptureData } from "./ExitIntentLeadCaptureForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExitIntentLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
  onDismissed?: () => void;
}

export default function ExitIntentLeadCaptureModal({ 
  open, 
  onOpenChange,
  onCompleted,
  onDismissed 
}: ExitIntentLeadCaptureModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ExitIntentLeadCaptureData) => {
    setIsLoading(true);
    
    try {
      // Save to Supabase database
      const { error } = await supabase
        .from('demo_leads')
        .insert([{
          email: data.email,
          name: data.name,
          interest_type: data.interestType,
          phone: data.phone,
          source: data.source,
          user_agent: navigator.userAgent,
          additional_info: `Exit intent capture from ${window.location.pathname}`
        }]);

      if (error) throw error;

      toast.success("Thank you!", {
        description: "We'll keep you updated on Nuacha's journey. 🌟"
      });

      // Notify parent of completion
      onCompleted?.();

      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error('Lead capture error:', error);
      toast.error("Something went wrong", {
        description: "Please try again or contact us directly."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 rounded-2xl shadow-xl border-0">
        {/* Header with close button */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/5 to-accent/20 rounded-t-2xl">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              onDismissed?.();
              onOpenChange(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">💫</span>
            </div>
            <DialogTitle className="text-xl font-semibold text-center">
              Before you go...
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Want to stay updated on Nuacha's gentle approach to family finances?
            </p>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="p-6 pt-4">
          <ExitIntentLeadCaptureForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}