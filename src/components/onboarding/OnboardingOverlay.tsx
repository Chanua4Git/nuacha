import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingOverlayProps {
  target: string;
  onClickOutside?: () => void;
  className?: string;
}

export function OnboardingOverlay({ 
  target, 
  onClickOutside,
  className 
}: OnboardingOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateTargetRect = () => {
      const targetElement = document.querySelector(target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // Create a rect that includes scroll position
        setTargetRect({
          top: rect.top + scrollY,
          left: rect.left + scrollX,
          right: rect.right + scrollX,
          bottom: rect.bottom + scrollY,
          width: rect.width,
          height: rect.height,
          x: rect.x + scrollX,
          y: rect.y + scrollY,
        } as DOMRect);
      }
    };

    updateTargetRect();

    // Update on resize and scroll
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [target]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only call onClickOutside if clicking on the overlay itself, not the highlighted area
    if (e.target === e.currentTarget) {
      onClickOutside?.();
    }
  };

  if (!targetRect) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9998] pointer-events-auto",
        className
      )}
      onClick={handleOverlayClick}
      style={{
        background: `
          linear-gradient(to right, 
            rgba(0, 0, 0, 0.5) 0%, 
            rgba(0, 0, 0, 0.5) ${targetRect.left}px, 
            transparent ${targetRect.left}px, 
            transparent ${targetRect.right}px, 
            rgba(0, 0, 0, 0.5) ${targetRect.right}px, 
            rgba(0, 0, 0, 0.5) 100%
          ),
          linear-gradient(to bottom, 
            rgba(0, 0, 0, 0.5) 0%, 
            rgba(0, 0, 0, 0.5) ${targetRect.top}px, 
            transparent ${targetRect.top}px, 
            transparent ${targetRect.bottom}px, 
            rgba(0, 0, 0, 0.5) ${targetRect.bottom}px, 
            rgba(0, 0, 0, 0.5) 100%
          )
        `
      }}
    >
      {/* Highlighted target area - clickable */}
      <div
        className="absolute pointer-events-none animate-pulse"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          borderRadius: '8px',
          border: '2px solid hsl(var(--primary))',
          boxShadow: '0 0 20px hsl(var(--primary) / 0.5)'
        }}
      />
    </div>
  );
}