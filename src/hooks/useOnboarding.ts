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
      
      // Wait for target element to be available
      const checkTarget = () => {
        const targetElement = document.querySelector(target);
        if (targetElement) {
          setTooltip(target, content.content, content.position);
        } else {
          // Retry after a short delay
          setTimeout(checkTarget, 100);
        }
      };

      checkTarget();
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