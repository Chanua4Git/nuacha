import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface PayPalOrderResponse {
  orderId: string;
  approvalUrl: string;
}

export const usePayPalPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createOrder = async (payrollPeriodId: string, amount: number): Promise<PayPalOrderResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paypal-create-order', {
        body: {
          payrollPeriodId,
          amount
        }
      });

      if (error) {
        console.error('PayPal create order error:', error);
        toast({
          title: "Payment Error",
          description: "Failed to create PayPal order. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const captureOrder = async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paypal-capture-order', {
        body: {
          orderId
        }
      });

      if (error) {
        console.error('PayPal capture order error:', error);
        toast({
          title: "Payment Error",
          description: "Failed to complete payment. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "Payment Successful",
          description: "Your payroll payment has been processed successfully.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createOrder,
    captureOrder,
    isLoading
  };
};