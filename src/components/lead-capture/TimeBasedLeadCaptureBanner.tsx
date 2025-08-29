import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimeBasedLeadCaptureForm, { TimeBasedLeadCaptureData } from "./TimeBasedLeadCaptureForm";
import { toast } from "sonner";

interface TimeBasedLeadCaptureBannerProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  onDismissed?: () => void;
}

export default function TimeBasedLeadCaptureBanner({ 
  open, 
  onClose,
  onCompleted,
  onDismissed 
}: TimeBasedLeadCaptureBannerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: TimeBasedLeadCaptureData) => {
    setIsLoading(true);
    
    try {
      // Store lead data in localStorage (same as exit-intent)
      const existingLeads = JSON.parse(localStorage.getItem('nuacha_leads') || '[]');
      const leadData = {
        ...data,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      existingLeads.push(leadData);
      localStorage.setItem('nuacha_leads', JSON.stringify(existingLeads));
      
      toast.success("Thank you for your interest!", {
        description: "We'll keep you updated on Nuacha's financial management solutions.",
      });
      
      // Notify parent of completion
      onCompleted?.();
      
      // Close banner after successful submission
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-out ${
        open ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-t border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Message Section */}
            <div className="flex-shrink-0">
              <h3 className="text-sm font-medium text-foreground mb-1">
                Interested in financial management solutions?
              </h3>
              <p className="text-xs text-muted-foreground">
                Get early access updates for Nuacha's household expense tracking
              </p>
            </div>

            {/* Form Section */}
            <div className="flex-1 max-w-2xl w-full">
              <TimeBasedLeadCaptureForm 
                onSubmit={handleSubmit} 
                isLoading={isLoading}
              />
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDismissed?.();
                onClose();
              }}
              className="h-8 w-8 p-0 flex-shrink-0"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close banner</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}