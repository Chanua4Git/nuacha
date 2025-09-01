import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface LeadCaptureStatus {
  exitIntent: {
    completed: boolean;
    dismissed: boolean;
    lastAttempt?: string;
  };
  timeBased: {
    completed: boolean;
    dismissed: boolean;
    lastAttempt?: string;
  };
  globalDisabled: boolean;
  lastCompletedMethod?: 'exit-intent' | 'time-based';
}

interface LeadCaptureManagerOptions {
  dismissalCooldown?: number; // Hours before allowing re-engagement after dismissal
  respectGlobalDisable?: boolean;
}

const STORAGE_KEY = 'nuacha_lead_capture_status';
const DEFAULT_DISMISSAL_COOLDOWN = 24; // 24 hours

export function useLeadCaptureManager(options: LeadCaptureManagerOptions = {}) {
  const { 
    dismissalCooldown = DEFAULT_DISMISSAL_COOLDOWN, 
    respectGlobalDisable = true 
  } = options;

  const { user } = useAuth();

  const [status, setStatus] = useState<LeadCaptureStatus>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse lead capture status from localStorage:', error);
    }
    
    return {
      exitIntent: { completed: false, dismissed: false },
      timeBased: { completed: false, dismissed: false },
      globalDisabled: false
    };
  });

  // Save status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  }, [status]);

  // Check if enough time has passed since dismissal to allow re-engagement
  const canReengage = useCallback((method: 'exitIntent' | 'timeBased') => {
    const methodStatus = status[method];
    if (!methodStatus.dismissed || methodStatus.completed) return true;
    
    if (methodStatus.lastAttempt) {
      const lastAttemptTime = new Date(methodStatus.lastAttempt).getTime();
      const now = Date.now();
      const hoursSinceLastAttempt = (now - lastAttemptTime) / (1000 * 60 * 60);
      return hoursSinceLastAttempt >= dismissalCooldown;
    }
    
    return true;
  }, [status, dismissalCooldown]);

  // Main logic to determine if a capture method should be enabled
  const shouldEnableCapture = useCallback((method: 'exitIntent' | 'timeBased') => {
    // Never show lead capture to authenticated users
    if (user) return false;
    
    // If globally disabled, don't show anything
    if (respectGlobalDisable && status.globalDisabled) return false;
    
    // If any method was completed, disable all future attempts
    if (status.exitIntent.completed || status.timeBased.completed) return false;
    
    const methodStatus = status[method];
    
    // If this specific method was completed, never show again
    if (methodStatus.completed) return false;
    
    // If dismissed recently, respect cooldown period
    if (methodStatus.dismissed && !canReengage(method)) return false;
    
    // Special coordination logic between methods
    if (method === 'timeBased') {
      // If exit-intent was dismissed recently, delay time-based capture
      if (status.exitIntent.dismissed && !canReengage('exitIntent')) {
        return false;
      }
    }
    
    return true;
  }, [user, status, respectGlobalDisable, canReengage]);

  // Mark a method as completed
  const markCompleted = useCallback((method: 'exit-intent' | 'time-based') => {
    const methodKey = method === 'exit-intent' ? 'exitIntent' : 'timeBased';
    setStatus(prev => ({
      ...prev,
      [methodKey]: {
        ...prev[methodKey],
        completed: true,
        dismissed: false,
        lastAttempt: new Date().toISOString()
      },
      globalDisabled: true, // Disable all future attempts once someone completes
      lastCompletedMethod: method
    }));
  }, []);

  // Mark a method as dismissed
  const markDismissed = useCallback((method: 'exit-intent' | 'time-based') => {
    const methodKey = method === 'exit-intent' ? 'exitIntent' : 'timeBased';
    setStatus(prev => ({
      ...prev,
      [methodKey]: {
        ...prev[methodKey],
        dismissed: true,
        lastAttempt: new Date().toISOString()
      }
    }));
  }, []);

  // Disable all lead capture globally (user preference)
  const disableGlobally = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      globalDisabled: true
    }));
  }, []);

  // Reset status (for testing/debugging)
  const resetStatus = useCallback(() => {
    setStatus({
      exitIntent: { completed: false, dismissed: false },
      timeBased: { completed: false, dismissed: false },
      globalDisabled: false
    });
  }, []);

  // Get user-friendly status message
  const getStatusMessage = useCallback(() => {
    if (status.globalDisabled && status.lastCompletedMethod) {
      return `Thank you for your interest! You've already signed up via ${status.lastCompletedMethod}.`;
    }
    if (status.globalDisabled) {
      return "Lead capture has been disabled.";
    }
    return null;
  }, [status]);

  return {
    // Status checks
    shouldEnableExitIntent: shouldEnableCapture('exitIntent'),
    shouldEnableTimeBased: shouldEnableCapture('timeBased'),
    isGloballyDisabled: status.globalDisabled,
    
    // Actions
    markCompleted,
    markDismissed,
    disableGlobally,
    
    // Utilities
    getStatusMessage,
    resetStatus, // Only for development/testing
    
    // Raw status (for debugging)
    status
  };
}