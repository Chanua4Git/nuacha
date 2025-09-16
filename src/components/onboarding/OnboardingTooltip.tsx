import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, RefreshCw, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OnboardingTooltipProps {
  target: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'subtle';
  closeBehavior?: 'hide' | 'skip';
  onNext?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  showSkip?: boolean;
}

export function OnboardingTooltip({
  target,
  content,
  position = 'bottom',
  variant = 'default',
  closeBehavior = 'skip',
  onNext,
  onSkip,
  onClose,
  showSkip = true
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [isPositioned, setIsPositioned] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const calculatePosition = () => {
      const targetElement = document.querySelector(target);
      if (!targetElement || !tooltipRef.current) return;

      // Use requestAnimationFrame for better measurement timing
      requestAnimationFrame(() => {
        if (!tooltipRef.current) return;
        
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Simple uniform positioning: always try top-left first
        const offset = 12; // Fixed offset for uniformity
        const padding = 16; // Viewport padding
        
        // Primary position: top-left of target with offset
        let top = targetRect.top + scrollY - tooltipRect.height - offset;
        let left = targetRect.left + scrollX;
        let currentPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
        
        // Smart fallback system with bounds checking
        const viewportTop = scrollY + padding;
        const viewportBottom = scrollY + viewportHeight - padding;
        const viewportLeft = scrollX + padding;
        const viewportRight = scrollX + viewportWidth - padding;
        
        // Check if primary position fits
        const fitsVertically = top >= viewportTop;
        const fitsHorizontally = left >= viewportLeft && (left + tooltipRect.width) <= viewportRight;
        
        if (!fitsVertically) {
          // Fallback 1: bottom-left of target
          top = targetRect.bottom + scrollY + offset;
          currentPosition = 'bottom';
          
          // Check if bottom position fits
          if (top + tooltipRect.height > viewportBottom) {
            // Fallback 2: Force within viewport bounds
            top = Math.min(targetRect.top + scrollY - tooltipRect.height - offset, viewportBottom - tooltipRect.height);
            currentPosition = 'top';
            
            // Emergency fallback: ensure tooltip is at least partially visible
            if (top < viewportTop) {
              top = viewportTop;
            }
          }
        }
        
        // Handle horizontal bounds (mobile vs desktop)
        if (isMobile) {
          // Full width on mobile with padding
          left = padding;
        } else {
          // Desktop: ensure tooltip doesn't go off-screen horizontally
          if (!fitsHorizontally) {
            // Try right side of target
            const rightPosition = targetRect.right + scrollX - tooltipRect.width;
            if (rightPosition >= viewportLeft) {
              left = rightPosition;
            } else {
              // Force within bounds
              left = Math.max(viewportLeft, Math.min(left, viewportRight - tooltipRect.width));
            }
          }
        }

        setActualPosition(currentPosition);
        setTooltipPosition({ top, left });
        setIsPositioned(true);
      });
    };

    // Add highlight to target element
    const targetElement = document.querySelector(target);
    if (targetElement) {
      targetElement.classList.add('onboarding-highlight');
      setIsVisible(true);
    }

    // Calculate position immediately and after a brief delay for fallback
    calculatePosition();
    const timer = setTimeout(calculatePosition, 100);

    // Recalculate on window resize or scroll
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
      
      // Remove highlight
      if (targetElement) {
        targetElement.classList.remove('onboarding-highlight');
      }
    };
  }, [target, position, isMobile]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0 border-solid";
    const arrowColor = variant === 'subtle' ? 'border-popover' : 'border-primary';
    
    // Simplified arrow positioning for uniform top-left strategy
    switch (actualPosition) {
      case 'bottom':
        return cn(baseClasses, `border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent ${arrowColor} -top-2 left-4`);
      case 'top':
      default:
        return cn(baseClasses, `border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${arrowColor} -bottom-2 left-4`);
    }
  };

  const handleRestart = () => {
    // Restart tutorial functionality
    window.location.href = window.location.pathname + '?tour=1';
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[9999] rounded-2xl shadow-2xl backdrop-blur-sm transition-opacity duration-300",
          "transform transition-all duration-300 ease-out",
          isPositioned ? "opacity-100" : "opacity-0",
          isMobile 
            ? "max-w-[calc(100vw-1.5rem)] p-4 mx-3" 
            : "max-w-sm p-6"
        )}
        style={{
          top: tooltipPosition.top,
          left: isMobile ? 12 : tooltipPosition.left,
          width: isMobile ? 'calc(100vw - 1.5rem)' : 'auto',
          background: variant === 'subtle' ? 'hsl(var(--popover))' : 'hsl(var(--primary))',
          border: variant === 'subtle' ? '1px solid hsl(var(--border))' : '1px solid hsl(var(--primary) / 0.3)',
          boxShadow: variant === 'subtle' ? '0 10px 20px -10px rgba(0,0,0,0.15)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px hsl(var(--primary) / 0.15)',
        }}
      >
        {/* Arrow */}
        <div className={getArrowClasses()} />
        
        {/* Content */}
        <div className="relative">
          {onClose && variant !== 'subtle' && (
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              className={cn(
                "absolute -top-1 -right-1 p-0 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full",
                isMobile ? "h-8 w-8" : "h-7 w-7"
              )}
              onClick={onClose}
            >
              <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          )}
          
          <p className={cn(
            "leading-relaxed font-medium",
            variant === 'subtle' ? "text-popover-foreground" : "text-white",
            isMobile ? "text-sm pr-6" : variant === 'subtle' ? "text-sm pr-4" : "text-base pr-8"
          )}>
            {content}
          </p>
          
          <div className={cn(
            "flex gap-2 mt-4",
            isMobile ? "flex-col" : "flex-row gap-3 mt-5"
          )}>
            {onNext && (
              <Button
                size={isMobile ? "default" : "sm"}
                onClick={onNext}
                className={cn(
                  "bg-white text-primary hover:bg-white/90 font-semibold rounded-lg transition-all duration-200",
                  isMobile 
                    ? "w-full py-3 text-base" 
                    : "px-4 py-2 hover:scale-105"
                )}
              >
                Got it!
              </Button>
            )}
            
            <div className={cn(
              "flex gap-2",
              isMobile ? "justify-between" : "gap-3"
            )}>
              {showSkip && onSkip && (
                <Button
                  size={isMobile ? "default" : "sm"}
                  variant="ghost"
                  onClick={onSkip}
                  className={cn(
                    "text-white/80 hover:text-white hover:bg-white/10 font-medium rounded-lg transition-all duration-200",
                    isMobile ? "flex-1 py-3" : "px-3 py-2"
                  )}
                >
                  Close for now
                </Button>
              )}
              
              <Button
                size={isMobile ? "default" : "sm"}
                variant="ghost"
                onClick={handleRestart}
                className={cn(
                  "text-white/60 hover:text-white/80 hover:bg-white/5 font-medium rounded-lg transition-all duration-200",
                  isMobile ? "flex-1 py-3" : "px-3 py-2"
                )}
              >
                <RefreshCw className={isMobile ? "h-4 w-4 mr-2" : "h-3 w-3 mr-1"} />
                Restart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
