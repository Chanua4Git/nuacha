import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface SubscriptionLimits {
  maxEmployees: number;
  hasAdvancedReporting: boolean;
  hasExportFeatures: boolean;
  hasPrioritySupport: boolean;
  isActive: boolean;
}

export const useSubscriptionLimits = () => {
  const [limits, setLimits] = useState<SubscriptionLimits>({
    maxEmployees: 5, // Free tier default
    hasAdvancedReporting: false,
    hasExportFeatures: true,
    hasPrioritySupport: false,
    isActive: false
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubscriptionLimits();
    } else {
      // Demo user defaults
      setLimits({
        maxEmployees: 5,
        hasAdvancedReporting: false,
        hasExportFeatures: true,
        hasPrioritySupport: false,
        isActive: false
      });
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionLimits = async () => {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            max_employees,
            features
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (subscription?.subscription_plans) {
        const plan = subscription.subscription_plans;
        const features = plan.features as string[] || [];
        
        setLimits({
          maxEmployees: plan.max_employees || 5,
          hasAdvancedReporting: features.includes('advanced_reporting'),
          hasExportFeatures: features.includes('export_features'),
          hasPrioritySupport: features.includes('priority_support'),
          isActive: true
        });
      } else {
        // No active subscription - free tier
        setLimits({
          maxEmployees: 5,
          hasAdvancedReporting: false,
          hasExportFeatures: true,
          hasPrioritySupport: false,
          isActive: false
        });
      }
    } catch (error) {
      console.error('Error fetching subscription limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEmployeeLimit = (currentCount: number): boolean => {
    return currentCount < limits.maxEmployees;
  };

  const getEmployeeLimitMessage = (): string => {
    if (limits.isActive) {
      return `You can add up to ${limits.maxEmployees} employees with your current plan.`;
    }
    return `You can add up to ${limits.maxEmployees} employees with the free tier. Upgrade for more employees.`;
  };

  return {
    limits,
    loading,
    checkEmployeeLimit,
    getEmployeeLimitMessage,
    refreshLimits: fetchSubscriptionLimits
  };
};