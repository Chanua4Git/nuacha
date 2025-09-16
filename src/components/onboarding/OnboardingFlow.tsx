import React from 'react';
import { OnboardingTooltip } from './OnboardingTooltip';
import { OnboardingOverlay } from './OnboardingOverlay';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStep } from '@/services/OnboardingService';

export function OnboardingFlow() {
  const { state, nextStep, skipOnboarding, clearTooltip } = useOnboarding();
  const isActionGated = state.currentStep === OnboardingStep.GUIDE_TO_BUILDER || 
                       state.currentStep === OnboardingStep.ABOUT_YOU_NEXT;

  if (!state.isActive || !state.targetElement || !state.tooltipContent) {
    return null;
  }

  return (
    <>
      {isActionGated ? null : (
        <OnboardingOverlay
          target={state.targetElement}
          onClickOutside={clearTooltip}
        />
      )}
      <OnboardingTooltip
        target={state.targetElement}
        content={state.tooltipContent}
        variant={isActionGated ? 'subtle' : 'default'}
        onNext={isActionGated ? undefined : nextStep}
        onSkip={clearTooltip}
        onClose={clearTooltip}
        showSkip={true}
      />
    </>
  );
}