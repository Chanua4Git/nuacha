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
        
        // Mobile-specific padding and spacing
        const padding = isMobile ? 12 : 16;
        const offset = isMobile ? 8 : 12;
        
        let top = 0;
        let left = 0;
        let currentPosition = position;

        // Smart positioning for mobile - prefer top/bottom over left/right
        if (isMobile && (position === 'left' || position === 'right')) {
          currentPosition = targetRect.top > window.innerHeight / 2 ? 'top' : 'bottom';
        }

        switch (currentPosition) {
          case 'bottom':
            top = targetRect.bottom + scrollY + offset;
            left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'top':
            top = targetRect.top + scrollY - tooltipRect.height - offset;
            left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'left':
            top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.left + scrollX - tooltipRect.width - offset;
            break;
          case 'right':
            top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.right + scrollX + offset;
            break;
        }

        // Smart fallback positioning for mobile
        if (isMobile) {
          // If tooltip would go off screen horizontally, center it
          if (left < padding || left + tooltipRect.width > window.innerWidth - padding) {
            left = padding;
          }
          
          // If tooltip would go off screen vertically, flip position
          if (currentPosition === 'top' && top < padding + scrollY) {
            currentPosition = 'bottom';
            top = targetRect.bottom + scrollY + offset;
          } else if (currentPosition === 'bottom' && top + tooltipRect.height > window.innerHeight + scrollY - padding) {
            currentPosition = 'top';
            top = targetRect.top + scrollY - tooltipRect.height - offset;
          }
        } else {
          // Desktop positioning with bounds checking
          left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
          top = Math.max(padding + scrollY, top);
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
    const arrowSize = isMobile ? "6" : "8";
    
    switch (actualPosition) {
      case 'bottom':
        return cn(baseClasses, `border-l-${arrowSize} border-r-${arrowSize} border-b-${arrowSize} border-l-transparent border-r-transparent border-b-primary -top-2 left-1/2 transform -translate-x-1/2`);
      case 'top':
        return cn(baseClasses, `border-l-${arrowSize} border-r-${arrowSize} border-t-${arrowSize} border-l-transparent border-r-transparent border-t-primary -bottom-2 left-1/2 transform -translate-x-1/2`);
      case 'left':
        return cn(baseClasses, `border-t-${arrowSize} border-b-${arrowSize} border-l-${arrowSize} border-t-transparent border-b-transparent border-l-primary -right-2 top-1/2 transform -translate-y-1/2`);
      case 'right':
        return cn(baseClasses, `border-t-${arrowSize} border-b-${arrowSize} border-r-${arrowSize} border-t-transparent border-b-transparent border-r-primary -left-2 top-1/2 transform -translate-y-1/2`);
      default:
        return "";
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
