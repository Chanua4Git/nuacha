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
    <>
      {/* Highlighted target area with elegant border */}
      <div
        className="fixed z-[9998] pointer-events-none animate-pulse"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          borderRadius: '16px',
          border: '4px solid #5A7684',
          boxShadow: '0 0 30px rgba(90, 118, 132, 0.6), 0 0 60px rgba(90, 118, 132, 0.3), 0 4px 20px rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(1px)'
        }}
      />
      
      {/* Invisible clickable overlay for outside clicks */}
      <div
        className={cn(
          "fixed inset-0 z-[9997] pointer-events-auto",
          className
        )}
        onClick={handleOverlayClick}
        style={{ background: 'transparent' }}
      />
    </>
  );
}