import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateOrderReference } from '@/utils/orderReference';
import { PlanType, BillingCycle, getPlanPrice } from '@/constants/nuachaPayment';
import { useToast } from '@/hooks/use-toast';

interface CreateOrderParams {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  planType: PlanType;
  billingCycle: BillingCycle;
}

interface SubscriptionOrder {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  plan_type: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  status: string;
  payment_confirmed: boolean;
  created_at: string;
}

export function useSubscriptionPurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<SubscriptionOrder | null>(null);
  const { toast } = useToast();

  const createOrder = async (params: CreateOrderParams): Promise<SubscriptionOrder | null> => {
    setIsLoading(true);
    
    try {
      const orderReference = generateOrderReference();
      const amount = getPlanPrice(params.planType, params.billingCycle);
      
      const orderData = {
        order_reference: orderReference,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone || null,
        plan_type: params.planType,
        billing_cycle: params.billingCycle,
        amount,
        currency: 'USD',
        status: 'pending_payment'
      };
      
      const { data, error } = await supabase
        .from('subscription_orders')
        .insert(orderData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating subscription order:', error);
        toast({
          title: "Order creation failed",
          description: "Please try again or contact support.",
          variant: "destructive"
        });
        return null;
      }
      
      setOrder(data as SubscriptionOrder);
      toast({
        title: "Order created!",
        description: `Your order reference is ${orderReference}`
      });
      
      return data as SubscriptionOrder;
    } catch (err) {
      console.error('Error in createOrder:', err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('subscription_orders')
        .update({
          payment_confirmed: true,
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: user?.id,
          status: 'payment_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error confirming payment:', error);
        toast({
          title: "Failed to confirm payment",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Payment confirmed!",
        description: "Customer subscription is now active."
      });
      
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const revokePayment = async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('subscription_orders')
        .update({
          payment_confirmed: false,
          payment_confirmed_at: null,
          payment_confirmed_by: null,
          status: 'pending_payment',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error revoking payment:', error);
        toast({
          title: "Failed to revoke payment",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Payment revoked",
        description: "Order status reset to pending."
      });
      
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    order,
    createOrder,
    confirmPayment,
    revokePayment
  };
}
