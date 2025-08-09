import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { usePayPalPayment } from "@/hooks/usePayPalPayment";
import { useToast } from "@/components/ui/use-toast";

interface PayPalPaymentButtonProps {
  payrollPeriodId: string;
  amount: number;
  disabled?: boolean;
  onPaymentSuccess?: () => void;
}

export const PayPalPaymentButton = ({ 
  payrollPeriodId, 
  amount, 
  disabled = false,
  onPaymentSuccess 
}: PayPalPaymentButtonProps) => {
  const { createOrder, isLoading } = usePayPalPayment();
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      const orderData = await createOrder(payrollPeriodId, amount);
      
      if (orderData?.approvalUrl) {
        // Redirect to PayPal for payment approval
        window.location.href = orderData.approvalUrl;
      } else {
        toast({
          title: "Payment Error",
          description: "Unable to initiate PayPal payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to start payment process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className="w-full gap-2"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Pay with PayPal (${amount.toFixed(2)})
        </>
      )}
    </Button>
  );
};