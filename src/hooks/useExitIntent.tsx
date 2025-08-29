import { useState, useEffect, useRef } from 'react';

interface UseExitIntentOptions {
  threshold?: number; // Distance from top in pixels to trigger
  delay?: number; // Delay in ms before allowing trigger again
  enabled?: boolean; // Whether exit intent detection is enabled
}

export function useExitIntent(options: UseExitIntentOptions = {}) {
  const { threshold = 50, delay = 1000, enabled = true } = options;
  const [showExitIntent, setShowExitIntent] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasTriggeredRef.current) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Check if mouse is leaving toward the top of the screen
      if (e.clientY <= threshold && e.relatedTarget === null) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          if (!hasTriggeredRef.current) {
            setShowExitIntent(true);
            hasTriggeredRef.current = true;
          }
        }, delay);
      }
    };

    const handleMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold, delay, enabled]);

  const resetExitIntent = () => {
    setShowExitIntent(false);
  };

  const disableExitIntent = () => {
    hasTriggeredRef.current = true;
    setShowExitIntent(false);
  };

  return {
    showExitIntent,
    resetExitIntent,
    disableExitIntent
  };
}