import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface SubscriptionData {
  id: string;
  plan_type: string;
  status: string;
  billing_cycle: string;
  amount: number;
  customer_email: string;
}

interface UseActiveSubscriptionReturn {
  hasActiveSubscription: boolean;
  subscription: SubscriptionData | null;
  planType: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Map plan types to feature access
const PLAN_FEATURES: Record<string, string[]> = {
  families: ['budget', 'unlimited_scans', 'multi_family'],
  business: ['budget', 'payroll', 'unlimited_scans', 'multi_family'],
  entrepreneurs: ['budget', 'payroll', 'unlimited_scans', 'multi_family'],
};

export const useActiveSubscription = (): UseActiveSubscriptionReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check subscription_orders for active subscription
      const { data, error: fetchError } = await supabase
        .from('subscription_orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user?.id]);

  const hasActiveSubscription = !!subscription && subscription.status === 'active';
  const planType = subscription?.plan_type || null;

  return {
    hasActiveSubscription,
    subscription,
    planType,
    isLoading,
    error,
    refetch: fetchSubscription,
  };
};

// Helper function to check if a plan has access to a specific feature
export const hasFeatureAccess = (planType: string | null, feature: string): boolean => {
  if (!planType) return false;
  const features = PLAN_FEATURES[planType.toLowerCase()] || [];
  return features.includes(feature);
};
