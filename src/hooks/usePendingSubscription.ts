import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface PendingSubscription {
  id: string;
  order_reference: string;
  plan_type: string;
  billing_cycle: string;
  amount_ttd: number | null;
  amount_usd: number | null;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at: string;
}

export function usePendingSubscription() {
  const { user } = useAuth();
  const [pendingOrder, setPendingOrder] = useState<PendingSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPendingOrder() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // First check localStorage for recently created order
        const storedOrder = localStorage.getItem('nuacha_pending_order');
        
        // Then fetch from database
        const { data, error } = await supabase
          .from('subscription_orders')
          .select('*')
          .eq('status', 'pending_payment')
          .eq('payment_confirmed', false)
          .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching pending subscription:', error);
        }

        if (data) {
          setPendingOrder(data as PendingSubscription);
        } else if (storedOrder) {
          // Use stored order if no database match
          const parsed = JSON.parse(storedOrder);
          setPendingOrder(parsed);
        }
      } catch (err) {
        console.error('Error in usePendingSubscription:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPendingOrder();
  }, [user]);

  return { pendingOrder, isLoading };
}
