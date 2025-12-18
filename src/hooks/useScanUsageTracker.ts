import { useState, useEffect, useCallback } from 'react';
import { useActiveSubscription, hasFeatureAccess } from './useActiveSubscription';
import { useStorageUsage } from './useStorageUsage';
import { NUACHA_SUBSCRIPTION_PLANS } from '@/constants/nuachaPayment';

interface ScanUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

const STORAGE_KEY = 'nuacha_scan_usage';
const FREE_DAILY_SCAN_LIMIT = NUACHA_SUBSCRIPTION_PLANS.getting_tidy.dailyScanLimit || 3;

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getUsageFromStorage(): ScanUsage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as ScanUsage;
      // Reset if it's a new day
      if (usage.date !== getTodayDateString()) {
        return { date: getTodayDateString(), count: 0 };
      }
      return usage;
    }
  } catch {
    // Ignore parsing errors
  }
  return { date: getTodayDateString(), count: 0 };
}

function saveUsageToStorage(usage: ScanUsage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore storage errors
  }
}

export function useScanUsageTracker() {
  const [usage, setUsage] = useState<ScanUsage>(getUsageFromStorage);
  const { hasActiveSubscription, planType, isLoading: subLoading } = useActiveSubscription();
  const { canUpload: hasStorageSpace, isLoading: storageLoading, percentUsed } = useStorageUsage();

  // Check if user has unlimited scans via subscription
  const hasUnlimitedScans = hasActiveSubscription && hasFeatureAccess(planType, 'unlimited_scans');

  // Refresh usage on mount and when date changes
  useEffect(() => {
    const currentUsage = getUsageFromStorage();
    setUsage(currentUsage);
  }, []);

  /**
   * Check if user can perform a scan
   * - Free users: limited to FREE_DAILY_SCAN_LIMIT per day
   * - Paid users: unlimited UNLESS storage is full
   */
  const canScan = useCallback((): boolean => {
    // Still checking - block scans to prevent race condition
    if (subLoading || storageLoading) return false;
    
    // Paid subscribers can scan until storage is full
    if (hasUnlimitedScans) {
      return hasStorageSpace;
    }
    
    // Free users have daily limit
    const currentUsage = getUsageFromStorage();
    return currentUsage.count < FREE_DAILY_SCAN_LIMIT;
  }, [hasUnlimitedScans, hasStorageSpace, subLoading, storageLoading]);

  const incrementScan = useCallback((): void => {
    const currentUsage = getUsageFromStorage();
    const newUsage = {
      date: getTodayDateString(),
      count: currentUsage.count + 1
    };
    saveUsageToStorage(newUsage);
    setUsage(newUsage);
    
    // Verify persistence immediately
    const verified = getUsageFromStorage();
    console.log('📊 Scan usage incremented:', { 
      previous: currentUsage.count, 
      new: newUsage.count,
      verified: verified.count,
      limit: FREE_DAILY_SCAN_LIMIT,
      remaining: FREE_DAILY_SCAN_LIMIT - verified.count
    });
  }, []);

  const getRemainingScans = useCallback((): number => {
    // Subscribers have unlimited (until storage full)
    if (hasUnlimitedScans) return Infinity;
    
    const currentUsage = getUsageFromStorage();
    return Math.max(0, FREE_DAILY_SCAN_LIMIT - currentUsage.count);
  }, [hasUnlimitedScans]);

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
    
    if (hasUnlimitedScans && !hasStorageSpace) {
      return 'storage_full';
    }
    
    return 'daily_limit';
  }, [canScan, hasUnlimitedScans, hasStorageSpace]);

  return {
    usage,
    canScan,
    incrementScan,
    getRemainingScans,
    getNextResetTime,
    getTimeUntilReset,
    getBlockedReason,
    dailyLimit: FREE_DAILY_SCAN_LIMIT,
    hasUnlimitedScans,
    hasStorageSpace,
    storagePercentUsed: percentUsed,
    isCheckingSubscription: subLoading || storageLoading
  };
}
