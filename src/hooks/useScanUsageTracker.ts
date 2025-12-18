import { useState, useEffect, useCallback } from 'react';
import { useActiveSubscription, hasFeatureAccess } from './useActiveSubscription';
import { useStorageUsage } from './useStorageUsage';
import { NUACHA_SUBSCRIPTION_PLANS } from '@/constants/nuachaPayment';
import { supabase } from '@/integrations/supabase/client';

interface ScanUsage {
  currentCount: number;
  dailyLimit: number;
  hasSubscription: boolean;
}

const FREE_DAILY_SCAN_LIMIT = NUACHA_SUBSCRIPTION_PLANS.getting_tidy.dailyScanLimit || 3;

export function useScanUsageTracker() {
  const [usage, setUsage] = useState<ScanUsage>({ currentCount: 0, dailyLimit: FREE_DAILY_SCAN_LIMIT, hasSubscription: false });
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const { hasActiveSubscription, planType, isLoading: subLoading } = useActiveSubscription();
  const { canUpload: hasStorageSpace, isLoading: storageLoading, percentUsed } = useStorageUsage();

  // Check if user has unlimited scans via subscription
  const hasUnlimitedScans = hasActiveSubscription && hasFeatureAccess(planType, 'unlimited_scans');

  // Get user email for tracking
  const getUserEmail = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  }, []);

  // Fetch current scan usage from database
  const fetchUsage = useCallback(async () => {
    try {
      setIsLoadingUsage(true);
      const email = await getUserEmail();
      
      if (!email) {
        // For unauthenticated users, check localStorage as fallback identifier
        const storedEmail = localStorage.getItem('nuacha_demo_email');
        if (!storedEmail) {
          setUsage({ currentCount: 0, dailyLimit: FREE_DAILY_SCAN_LIMIT, hasSubscription: false });
          setIsLoadingUsage(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || localStorage.getItem('nuacha_demo_email');
      
      if (!userEmail) {
        setUsage({ currentCount: 0, dailyLimit: FREE_DAILY_SCAN_LIMIT, hasSubscription: false });
        setIsLoadingUsage(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_scan_usage', {
        p_email: userEmail,
        p_user_id: user?.id || null
      });

      if (error) {
        console.error('Error fetching scan usage:', error);
        setIsLoadingUsage(false);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setUsage({
          currentCount: result.current_count,
          dailyLimit: result.daily_limit,
          hasSubscription: result.has_subscription
        });
      }
    } catch (err) {
      console.error('Error in fetchUsage:', err);
    } finally {
      setIsLoadingUsage(false);
    }
  }, [getUserEmail]);

  // Refresh usage on mount
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  /**
   * Check if user can perform a scan
   * - Free users: limited to FREE_DAILY_SCAN_LIMIT per day
   * - Paid users: unlimited UNLESS storage is full
   */
  const canScan = useCallback((): boolean => {
    // Still checking - block scans to prevent race condition
    if (subLoading || storageLoading || isLoadingUsage) return false;
    
    // Paid subscribers can scan until storage is full
    if (hasUnlimitedScans || usage.hasSubscription) {
      return hasStorageSpace;
    }
    
    // Free users have daily limit
    return usage.currentCount < FREE_DAILY_SCAN_LIMIT;
  }, [hasUnlimitedScans, hasStorageSpace, subLoading, storageLoading, isLoadingUsage, usage]);

  /**
   * Increment scan count via database function
   * Returns { success: boolean, currentCount: number }
   */
  const incrementScan = useCallback(async (email?: string): Promise<{ success: boolean; currentCount: number }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = email || user?.email || localStorage.getItem('nuacha_demo_email');
      
      if (!userEmail) {
        console.warn('No email available for scan tracking');
        return { success: false, currentCount: 0 };
      }

      // Store email for future tracking (anonymous users)
      if (!user?.email && userEmail) {
        localStorage.setItem('nuacha_demo_email', userEmail);
      }

      const { data, error } = await supabase.rpc('increment_scan_count', {
        p_email: userEmail,
        p_user_id: user?.id || null,
        p_ip_address: null // Could add IP tracking if needed
      });

      if (error) {
        console.error('Error incrementing scan count:', error);
        return { success: false, currentCount: usage.currentCount };
      }

      if (data && data.length > 0) {
        const result = data[0];
        const newCount = result.current_count;
        const isAllowed = result.is_allowed;
        
        setUsage(prev => ({
          ...prev,
          currentCount: newCount
        }));

        console.log('📊 Scan usage incremented (server-side):', { 
          newCount,
          isAllowed,
          limit: FREE_DAILY_SCAN_LIMIT,
          remaining: FREE_DAILY_SCAN_LIMIT - newCount
        });

        return { success: isAllowed, currentCount: newCount };
      }

      return { success: false, currentCount: usage.currentCount };
    } catch (err) {
      console.error('Error in incrementScan:', err);
      return { success: false, currentCount: usage.currentCount };
    }
  }, [usage.currentCount]);

  const getRemainingScans = useCallback((): number => {
    // Subscribers have unlimited (until storage full)
    if (hasUnlimitedScans || usage.hasSubscription) return Infinity;
    
    return Math.max(0, FREE_DAILY_SCAN_LIMIT - usage.currentCount);
  }, [hasUnlimitedScans, usage]);

  const getNextResetTime = useCallback((): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }, []);

  const getTimeUntilReset = useCallback((): string => {
    const now = new Date();
    const reset = getNextResetTime();
    const diffMs = reset.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  }, [getNextResetTime]);

  /**
   * Get the reason why scanning is blocked
   */
  const getBlockedReason = useCallback((): 'daily_limit' | 'storage_full' | null => {
    if (canScan()) return null;
    
    if ((hasUnlimitedScans || usage.hasSubscription) && !hasStorageSpace) {
      return 'storage_full';
    }
    
    return 'daily_limit';
  }, [canScan, hasUnlimitedScans, hasStorageSpace, usage.hasSubscription]);

  return {
    usage,
    canScan,
    incrementScan,
    getRemainingScans,
    getNextResetTime,
    getTimeUntilReset,
    getBlockedReason,
    dailyLimit: FREE_DAILY_SCAN_LIMIT,
    hasUnlimitedScans: hasUnlimitedScans || usage.hasSubscription,
    hasStorageSpace,
    storagePercentUsed: percentUsed,
    isCheckingSubscription: subLoading || storageLoading || isLoadingUsage,
    refetchUsage: fetchUsage
  };
}
