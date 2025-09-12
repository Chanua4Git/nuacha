import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent scrolling when touching the overlay on mobile
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
  };

  if (!targetRect) return null;

  const highlightPadding = isMobile ? 12 : 6;
  const borderWidth = isMobile ? 4 : 3;

  return (
    <>
      {/* Highlighted target area with elegant border */}
      <div
        className={cn(
          "fixed z-[1001] pointer-events-none animate-pulse",
          isMobile ? "rounded-2xl" : "rounded-xl"
        )}
        style={{
          top: targetRect.top - highlightPadding,
          left: targetRect.left - highlightPadding,
          width: targetRect.width + (highlightPadding * 2),
          height: targetRect.height + (highlightPadding * 2),
          border: `${borderWidth}px solid hsl(var(--primary))`,
          boxShadow: isMobile 
            ? '0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3)'
            : '0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
          background: 'hsl(var(--background) / 0.05)',
          backdropFilter: 'blur(1px)'
        }}
      />
      
      {/* Target area click-through hole - no click blocking */}
      <div
        className="fixed z-[1000] pointer-events-none"
        style={{
          top: targetRect.top - highlightPadding,
          left: targetRect.left - highlightPadding,
          width: targetRect.width + (highlightPadding * 2),
          height: targetRect.height + (highlightPadding * 2),
        }}
      />
      
      {/* Mobile-friendly overlay with touch support */}
      {isMobile ? (
        // Mobile: Use semi-transparent overlay instead of complex clip-path
        <div
          className={cn(
            "fixed inset-0 z-[999] pointer-events-auto bg-black/20 backdrop-blur-[0.5px]",
            className
          )}
          onClick={handleOverlayClick}
          onTouchStart={handleTouchStart}
          style={{
            // Create a radial mask to highlight the target area
            background: `radial-gradient(
              ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at 
              ${targetRect.left + targetRect.width/2}px ${targetRect.top + targetRect.height/2}px,
              transparent 0%, 
              transparent 50%, 
              rgba(0,0,0,0.1) 70%,
              rgba(0,0,0,0.2) 100%
            )`
          }}
        />
      ) : (
        // Desktop: Use clip-path for precise cutout
        <div
          className={cn(
            "fixed inset-0 z-[999] pointer-events-auto",
            className
          )}
          onClick={handleOverlayClick}
          style={{ 
            background: 'transparent',
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${targetRect.left - highlightPadding}px 100%, 
              ${targetRect.left - highlightPadding}px ${targetRect.top - highlightPadding}px, 
              ${targetRect.right + highlightPadding}px ${targetRect.top - highlightPadding}px, 
              ${targetRect.right + highlightPadding}px ${targetRect.bottom + highlightPadding}px, 
              ${targetRect.left - highlightPadding}px ${targetRect.bottom + highlightPadding}px, 
              ${targetRect.left - highlightPadding}px 100%, 
              100% 100%, 
              100% 0%
            )`
          }}
        />
      )}
    </>
  );
}