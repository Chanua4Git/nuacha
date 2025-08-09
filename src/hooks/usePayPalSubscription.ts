import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface PayPalSubscriptionResponse {
  subscriptionId: string;
  approvalUrl: string;
}

export const usePayPalSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createSubscription = async (planId: string): Promise<PayPalSubscriptionResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paypal-create-subscription', {
        body: {
          planId
        }
      });

      if (error) {
        console.error('PayPal create subscription error:', error);
        toast({
          title: "Subscription Error",
          description: "Failed to create PayPal subscription. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating PayPal subscription:', error);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const activateSubscription = async (subscriptionId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paypal-activate-subscription', {
        body: {
          subscriptionId
        }
      });

      if (error) {
        console.error('PayPal activate subscription error:', error);
        toast({
          title: "Subscription Error",
          description: "Failed to activate subscription. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "Subscription Activated",
          description: "Your subscription has been activated successfully.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error activating PayPal subscription:', error);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred during activation. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paypal-cancel-subscription', {
        body: {
          subscriptionId
        }
      });

      if (error) {
        console.error('PayPal cancel subscription error:', error);
        toast({
          title: "Cancellation Error",
          description: "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled successfully.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error cancelling PayPal subscription:', error);
      toast({
        title: "Cancellation Error",
        description: "An unexpected error occurred during cancellation. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSubscription,
    activateSubscription,
    cancelSubscription,
    isLoading
  };
};