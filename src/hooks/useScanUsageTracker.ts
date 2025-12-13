import { useState, useEffect, useCallback } from 'react';
import { useActiveSubscription, hasFeatureAccess } from './useActiveSubscription';

interface ScanUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

const STORAGE_KEY = 'nuacha_scan_usage';
const FREE_DAILY_SCAN_LIMIT = 3;

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

  // Check if user has unlimited scans via subscription
  const hasUnlimitedScans = hasActiveSubscription && hasFeatureAccess(planType, 'unlimited_scans');

  // Refresh usage on mount and when date changes
  useEffect(() => {
    const currentUsage = getUsageFromStorage();
    setUsage(currentUsage);
  }, []);

  const canScan = useCallback((): boolean => {
    // Subscribers get unlimited scans
    if (hasUnlimitedScans) return true;
    
    const currentUsage = getUsageFromStorage();
    return currentUsage.count < FREE_DAILY_SCAN_LIMIT;
  }, [hasUnlimitedScans]);

  const incrementScan = useCallback((): void => {
    const currentUsage = getUsageFromStorage();
    const newUsage = {
      date: getTodayDateString(),
      count: currentUsage.count + 1
    };
    saveUsageToStorage(newUsage);
    setUsage(newUsage);
  }, []);

  const getRemainingScans = useCallback((): number => {
    // Subscribers have unlimited
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

  return {
    usage,
    canScan,
    incrementScan,
    getRemainingScans,
    getNextResetTime,
    getTimeUntilReset,
    dailyLimit: FREE_DAILY_SCAN_LIMIT,
    hasUnlimitedScans,
    isCheckingSubscription: subLoading
  };
}
