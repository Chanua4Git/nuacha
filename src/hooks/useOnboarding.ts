import { useEffect } from 'react';
import { useOnboarding as useOnboardingContext } from '@/context/OnboardingContext';
import { OnboardingStep, OnboardingService } from '@/services/OnboardingService';

interface UseOnboardingOptions {
  step: OnboardingStep;
  target: string;
  enabled?: boolean;
  dependencies?: any[];
}

export function useOnboarding({ 
  step, 
  target, 
  enabled = true, 
  dependencies = [] 
}: UseOnboardingOptions) {
  const { state, setTooltip, clearTooltip, nextStep, skipOnboarding, isStepCompleted } = useOnboardingContext();

  useEffect(() => {
    if (!enabled || isStepCompleted(step)) {
      return;
    }

    // Only show tooltip if this is the current step
    if (state.currentStep === step) {
      const content = OnboardingService.getStepContent(step);
      
      console.log('🎯 useOnboarding hook activating for step:', step, 'targeting:', target);
      
      // Wait for target element to be available with persistent retries
      let retryCount = 0;
      const maxRetries = step === OnboardingStep.ABOUT_YOU_NEXT ? 50 : 20; // More retries for final step
      
      const checkTarget = () => {
        const targetElement = document.querySelector(target);
        retryCount++;
        
        console.log('🔍 Target element search result:', { 
          target, 
          found: !!targetElement, 
          element: targetElement, 
          retry: retryCount, 
          step 
        });
        
        if (targetElement) {
          console.log('✅ Setting tooltip for step:', step);
          
          // Ensure the target element is visible
          // For the first step, scroll to start to avoid jumping to middle
          // For ABOUT_YOU_NEXT, use 'start' to position tooltip above
          const scrollBlock = step === OnboardingStep.GUIDE_TO_BUILDER || step === OnboardingStep.ABOUT_YOU_NEXT ? 'start' : 'center';
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: scrollBlock,
            inline: 'nearest'
          });
          
          // Extra delay for final step to ensure DOM is ready
          if (step === OnboardingStep.ABOUT_YOU_NEXT) {
            setTimeout(() => {
              setTooltip(target, content.content, content.position);
              console.log('🎯 FINAL TOOLTIP successfully set for:', { step, target, element: targetElement });
            }, 200);
          } else {
            setTooltip(target, content.content, content.position);
            console.log('🎯 Tooltip successfully set for:', { step, target, element: targetElement });
          }
        } else if (retryCount < maxRetries) {
          console.log(`⏳ Target element not found, retrying ${retryCount}/${maxRetries} in 150ms...`);
          setTimeout(checkTarget, 150);
        } else {
          console.error('❌ Target element not found after max retries:', { step, target, maxRetries });
        }
      };

      checkTarget();
    } else {
      console.log('🚫 Step not current:', { hookStep: step, currentStep: state.currentStep });
    }

    return () => {
      if (state.currentStep === step) {
        clearTooltip();
      }
    };
  }, [step, target, enabled, state.currentStep, ...dependencies]);

  return {
    isCurrentStep: state.currentStep === step,
    isCompleted: isStepCompleted(step),
    nextStep,
    skipOnboarding
  };
}