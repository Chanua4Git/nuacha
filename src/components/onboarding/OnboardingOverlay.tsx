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
        
        // Use viewport coordinates for fixed positioning (no scroll offsets needed)
        setTargetRect({
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
        } as DOMRect);
      }
    };

    updateTargetRect();

    // Update on resize and scroll with passive listeners for better performance
    window.addEventListener('resize', updateTargetRect, { passive: true });
    window.addEventListener('scroll', updateTargetRect, { passive: true });

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
        className="fixed z-[1001] pointer-events-none animate-pulse"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          borderRadius: '12px',
          border: '3px solid hsl(var(--primary))',
          boxShadow: '0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
          background: 'hsl(var(--background) / 0.05)',
          backdropFilter: 'blur(1px)'
        }}
      />
      
      {/* Target area click-through hole - no click blocking */}
      <div
        className="fixed z-[1000] pointer-events-none"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
      />
      
      {/* Invisible clickable overlay for outside clicks only - with holes cut out */}
      <div
        className={cn(
          "fixed inset-0 z-[999] pointer-events-auto",
          className
        )}
        onClick={handleOverlayClick}
        style={{ 
          background: 'transparent',
          // Create a clip-path that excludes the target area
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${targetRect.left - 6}px 100%, 
            ${targetRect.left - 6}px ${targetRect.top - 6}px, 
            ${targetRect.right + 6}px ${targetRect.top - 6}px, 
            ${targetRect.right + 6}px ${targetRect.bottom + 6}px, 
            ${targetRect.left - 6}px ${targetRect.bottom + 6}px, 
            ${targetRect.left - 6}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
      />
    </>
  );
}