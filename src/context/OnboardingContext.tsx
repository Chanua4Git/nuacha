import React, { createContext, useContext, useEffect, useState } from 'react';
import { OnboardingService, OnboardingStep } from '@/services/OnboardingService';

interface OnboardingState {
  currentStep: OnboardingStep | null;
  isActive: boolean;
  targetElement: string | null;
  tooltipContent: string | null;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => void;
  setTooltip: (target: string, content: string, position?: 'top' | 'bottom' | 'left' | 'right') => void;
  clearTooltip: () => void;
  isStepCompleted: (step: OnboardingStep) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: null,
    isActive: false,
    targetElement: null,
    tooltipContent: null,
    position: 'bottom'
  });

  useEffect(() => {
    // Check if onboarding should be active based on current conditions
    const shouldStart = OnboardingService.shouldShowOnboarding();
    if (shouldStart && !state.isActive) {
      const nextStep = OnboardingService.getNextStep();
      if (nextStep !== null) {
        setState(prev => ({
          ...prev,
          currentStep: nextStep,
          isActive: true
        }));
      }
    }
  }, []);

  const startOnboarding = () => {
    const nextStep = OnboardingService.getNextStep();
    if (nextStep !== null) {
      setState(prev => ({
        ...prev,
        currentStep: nextStep,
        isActive: true
      }));
    }
  };

  const nextStep = () => {
    if (state.currentStep !== null) {
      OnboardingService.completeStep(state.currentStep);
      const next = OnboardingService.getNextStep();
      
      if (next !== null) {
        setState(prev => ({
          ...prev,
          currentStep: next,
          targetElement: null,
          tooltipContent: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          currentStep: null,
          isActive: false,
          targetElement: null,
          tooltipContent: null
        }));
      }
    }
  };

  const skipOnboarding = () => {
    OnboardingService.skipOnboarding();
    setState({
      currentStep: null,
      isActive: false,
      targetElement: null,
      tooltipContent: null,
      position: 'bottom'
    });
  };

  const setTooltip = (target: string, content: string, position: 'top' | 'bottom' | 'left' | 'right' = 'bottom') => {
    setState(prev => ({
      ...prev,
      targetElement: target,
      tooltipContent: content,
      position
    }));
  };

  const clearTooltip = () => {
    setState(prev => ({
      ...prev,
      targetElement: null,
      tooltipContent: null
    }));
  };

  const isStepCompleted = (step: OnboardingStep) => {
    return OnboardingService.isStepCompleted(step);
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        startOnboarding,
        nextStep,
        skipOnboarding,
        setTooltip,
        clearTooltip,
        isStepCompleted
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}