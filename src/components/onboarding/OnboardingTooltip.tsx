import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTooltipProps {
  target: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onNext?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  showSkip?: boolean;
}

export function OnboardingTooltip({
  target,
  content,
  position = 'bottom',
  onNext,
  onSkip,
  onClose,
  showSkip = true
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculatePosition = () => {
      const targetElement = document.querySelector(target);
      if (!targetElement || !tooltipRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'bottom':
          top = targetRect.bottom + scrollY + 12;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'top':
          top = targetRect.top + scrollY - tooltipRect.height - 12;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left + scrollX - tooltipRect.width - 12;
          break;
        case 'right':
          top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.right + scrollX + 12;
          break;
      }

      // Keep tooltip within viewport bounds
      const padding = 16;
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding + scrollY, top);

      setTooltipPosition({ top, left });
      setIsVisible(true);
    };

    // Add highlight to target element
    const targetElement = document.querySelector(target);
    if (targetElement) {
      targetElement.classList.add('onboarding-highlight');
    }

    // Calculate position after a brief delay to ensure DOM is ready
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
  }, [target, position]);

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
    
    switch (position) {
      case 'bottom':
        return cn(baseClasses, "border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[hsl(var(--primary))] -top-2 left-1/2 transform -translate-x-1/2");
      case 'top':
        return cn(baseClasses, "border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[hsl(var(--primary))] -bottom-2 left-1/2 transform -translate-x-1/2");
      case 'left':
        return cn(baseClasses, "border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-[hsl(var(--primary))] -right-2 top-1/2 transform -translate-y-1/2");
      case 'right':
        return cn(baseClasses, "border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[hsl(var(--primary))] -left-2 top-1/2 transform -translate-y-1/2");
      default:
        return "";
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[9999] max-w-sm bg-primary text-primary-foreground rounded-lg shadow-lg border border-primary/20 animate-fade-in",
          "p-4"
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Arrow */}
        <div className={getArrowClasses()} />
        
        {/* Content */}
        <div className="relative">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          <p className="text-sm leading-relaxed pr-6">{content}</p>
          
          <div className="flex gap-2 mt-3">
            {onNext && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onNext}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Got it!
              </Button>
            )}
            
            {showSkip && onSkip && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onSkip}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                Skip tutorial
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
