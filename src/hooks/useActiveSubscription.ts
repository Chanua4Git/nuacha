import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { NUACHA_SUBSCRIPTION_PLANS, PlanType } from '@/constants/nuachaPayment';

interface SubscriptionData {
  id: string;
  plan_type: string;
  status: string;
  billing_cycle: string;
  amount: number;
  amount_ttd?: number;
  amount_usd?: number;
  customer_email: string;
  storage_limit_mb?: number;
}

interface UseActiveSubscriptionReturn {
  hasActiveSubscription: boolean;
  subscription: SubscriptionData | null;
  planType: PlanType | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Map plan types to feature access
const PLAN_FEATURES: Record<string, string[]> = {
  getting_tidy: ['basic_tracking'],
  staying_organized: [
    'budget',
    'unlimited_scans',
    'multi_family',
    'reports',
    'categories',
    'reminders'
  ],
  fully_streamlined: [
    'budget',
    'payroll',
    'unlimited_scans',
    'multi_family',
    'reports',
    'categories',
    'reminders',
    'priority_support',
    'early_access'
  ],
  // Legacy plan mappings for backward compatibility
  families: [
    'budget',
    'unlimited_scans',
    'multi_family',
    'reports',
    'categories',
    'reminders'
  ],
  business: [
    'budget',
    'payroll',
    'unlimited_scans',
    'multi_family',
    'reports',
    'categories'
  ],
  entrepreneurs: [
    'budget',
    'payroll',
    'unlimited_scans',
    'multi_family',
    'reports',
    'categories',
    'priority_support'
  ],
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
  
  // Normalize plan type to new naming convention
  const normalizedPlanType = (() => {
    if (!subscription?.plan_type) return null;
    const pt = subscription.plan_type.toLowerCase();
    
    // Map legacy plan names to new ones
    if (pt === 'families') return 'staying_organized';
    if (pt === 'business' || pt === 'entrepreneurs') return 'fully_streamlined';
    
    // Already using new naming
    if (pt in NUACHA_SUBSCRIPTION_PLANS) return pt as PlanType;
    
    return null;
  })();

  return {
    hasActiveSubscription,
    subscription,
    planType: normalizedPlanType,
    isLoading,
    error,
    refetch: fetchSubscription,
  };
};

// Helper function to check if a plan has access to a specific feature
export const hasFeatureAccess = (planType: string | null, feature: string): boolean => {
  if (!planType) return false;
  
  // Normalize plan type
  const normalizedPlan = planType.toLowerCase();
  const features = PLAN_FEATURES[normalizedPlan] || [];
  return features.includes(feature);
};

// Get storage limit for a plan type (in MB)
export const getStorageLimitMB = (planType: string | null): number => {
  if (!planType) return NUACHA_SUBSCRIPTION_PLANS.getting_tidy.storageMB;
  
  const plan = NUACHA_SUBSCRIPTION_PLANS[planType as keyof typeof NUACHA_SUBSCRIPTION_PLANS];
  return plan?.storageMB || NUACHA_SUBSCRIPTION_PLANS.getting_tidy.storageMB;
};
