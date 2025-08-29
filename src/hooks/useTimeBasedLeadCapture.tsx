import { useState, useEffect, useRef } from 'react';

interface UseTimeBasedLeadCaptureOptions {
  inactivityThreshold?: number; // Time in ms before showing banner (default: 3 minutes)
  enabled?: boolean; // Whether time-based lead capture is enabled
}

export function useTimeBasedLeadCapture(options: UseTimeBasedLeadCaptureOptions = {}) {
  const { inactivityThreshold = 3 * 60 * 1000, enabled = true } = options; // 3 minutes default
  const [showBanner, setShowBanner] = useState(false);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const hasTriggeredRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled || hasTriggeredRef.current) return;

    // Check if banner was already shown in this session
    const sessionKey = 'nuacha_time_based_banner_shown';
    if (sessionStorage.getItem(sessionKey) === 'true') {
      hasTriggeredRef.current = true;
      return;
    }

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        if (!hasTriggeredRef.current) {
          setShowBanner(true);
          hasTriggeredRef.current = true;
          sessionStorage.setItem(sessionKey, 'true');
        }
      }, inactivityThreshold);
    };

    // Activity event listeners
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Start initial timer
    resetInactivityTimer();

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    return () => {
      // Cleanup
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [inactivityThreshold, enabled]);

  const closeBanner = () => {
    setShowBanner(false);
  };

  const disableBanner = () => {
    hasTriggeredRef.current = true;
    setShowBanner(false);
    sessionStorage.setItem('nuacha_time_based_banner_shown', 'true');
  };

  return {
    showBanner,
    closeBanner,
    disableBanner
  };
}