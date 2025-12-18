import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useActiveSubscription } from './useActiveSubscription';
import { NUACHA_SUBSCRIPTION_PLANS, formatStorageSize } from '@/constants/nuachaPayment';

interface StorageUsageReturn {
  usedMB: number;
  limitMB: number;
  percentUsed: number;
  canUpload: boolean;
  isLoading: boolean;
  formattedUsed: string;
  formattedLimit: string;
  isNearLimit: boolean; // > 80%
  isAtLimit: boolean; // > 95%
  refetch: () => Promise<void>;
}

export function useStorageUsage(): StorageUsageReturn {
  const { user } = useAuth();
  const { planType, hasActiveSubscription } = useActiveSubscription();
  const [usedMB, setUsedMB] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Determine storage limit based on plan
  const limitMB = (() => {
    if (!hasActiveSubscription || !planType) {
      return NUACHA_SUBSCRIPTION_PLANS.getting_tidy.storageMB;
    }
    const plan = NUACHA_SUBSCRIPTION_PLANS[planType as keyof typeof NUACHA_SUBSCRIPTION_PLANS];
    return plan?.storageMB || NUACHA_SUBSCRIPTION_PLANS.getting_tidy.storageMB;
  })();

  const fetchStorageUsage = useCallback(async () => {
    if (!user?.id) {
      setUsedMB(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // List all files in user's receipt folder
      const { data: files, error } = await supabase.storage
        .from('receipts')
        .list(user.id, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching storage usage:', error);
        setUsedMB(0);
        return;
      }

      // Calculate total size in MB
      const totalBytes = files?.reduce((sum, file) => {
        // file.metadata?.size contains file size in bytes
        return sum + (file.metadata?.size || 0);
      }, 0) || 0;

      const totalMB = totalBytes / (1024 * 1024);
      setUsedMB(Math.round(totalMB * 100) / 100); // Round to 2 decimal places
    } catch (err) {
      console.error('Error calculating storage:', err);
      setUsedMB(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStorageUsage();
  }, [fetchStorageUsage]);

  const percentUsed = limitMB > 0 ? (usedMB / limitMB) * 100 : 0;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 95;
  const canUpload = percentUsed < 100;

  return {
    usedMB,
    limitMB,
    percentUsed: Math.min(percentUsed, 100),
    canUpload,
    isLoading,
    formattedUsed: formatStorageSize(usedMB),
    formattedLimit: formatStorageSize(limitMB),
    isNearLimit,
    isAtLimit,
    refetch: fetchStorageUsage
  };
}
