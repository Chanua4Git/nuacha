import React, { createContext, useContext, useEffect, useState } from 'react';
import { OnboardingService, OnboardingStep } from '@/services/OnboardingService';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const [state, setState] = useState<OnboardingState>({
    currentStep: null,
    isActive: false,
    targetElement: null,
    tooltipContent: null,
    position: 'bottom'
  });

  // Debug logging to track onboarding state
  useEffect(() => {
    console.log('🎯 Onboarding Debug:', {
      currentStep: state.currentStep,
      isActive: state.isActive,
      pathname: location.pathname,
      shouldShow: OnboardingService.shouldShowOnboarding(),
      nextStep: OnboardingService.getNextStep(),
      isCompleted: OnboardingService.isOnboardingCompleted(),
      isSkipped: OnboardingService.isOnboardingSkipped()
    });
  }, [state, location.pathname]);

  // Check onboarding state whenever route changes or component mounts
  useEffect(() => {
    console.log('🔄 Checking onboarding conditions for route:', location.pathname);
    
    const shouldStart = OnboardingService.shouldShowOnboarding();
    const nextStep = OnboardingService.getNextStep();
    
    console.log('📋 Onboarding check result:', { shouldStart, nextStep, currentlyActive: state.isActive });

    if (shouldStart && nextStep !== null) {
      // Start or update onboarding
      if (!state.isActive || state.currentStep !== nextStep) {
        console.log('✅ Starting/updating onboarding to step:', nextStep);
        setState(prev => ({
          ...prev,
          currentStep: nextStep,
          isActive: true,
          targetElement: null,
          tooltipContent: null
        }));
      }
    } else if (!shouldStart && state.isActive) {
      // Stop onboarding
      console.log('❌ Stopping onboarding');
      setState(prev => ({
        ...prev,
        currentStep: null,
        isActive: false,
        targetElement: null,
        tooltipContent: null
      }));
    }
  }, [location.pathname, location.search]); // React to route changes

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