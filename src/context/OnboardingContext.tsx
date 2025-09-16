import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { OnboardingService, OnboardingStep } from '@/services/OnboardingService';
import { useLocation } from 'react-router-dom';

interface OnboardingState {
  currentStep: OnboardingStep | null;
  isActive: boolean;
  targetElement: string | null;
  tooltipContent: string | null;
}

interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => void;
  setTooltip: (target: string, content: string) => void;
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
    tooltipContent: null
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
    
    // Check for force tour parameter
    const urlParams = new URLSearchParams(location.search);
    const forceTour = urlParams.get('tour') === '1';
    
    // Handle force restart if tour=1 is present
    if (forceTour) {
      console.log('🔄 Force tour detected, resetting onboarding...');
      OnboardingService.resetOnboarding();
      
      // Remove tour parameter from URL to clean it up
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('tour');
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    const shouldStart = forceTour || OnboardingService.shouldShowOnboarding();
    let nextStep = OnboardingService.getNextStep();
    
    // If force tour and nextStep is still null (shouldn't happen after reset, but fallback)
    if (forceTour && nextStep === null) {
      nextStep = OnboardingStep.GUIDE_TO_BUILDER;
    }
    
    console.log('📋 Onboarding check result:', { 
      shouldStart, 
      nextStep, 
      currentlyActive: state.isActive, 
      forceTour,
      pathname: location.pathname,
      search: location.search
    });

    if (shouldStart && nextStep !== null) {
      // Start or update onboarding
      if (!state.isActive || state.currentStep !== nextStep) {
        console.log('✅ Starting/updating onboarding to step:', nextStep, forceTour ? '(force mode)' : '');
        setState(prev => ({
          ...prev,
          currentStep: nextStep,
          isActive: true,
          targetElement: null,
          tooltipContent: null
        }));
      }
    } else if (!shouldStart && !forceTour && state.isActive && !location.pathname.includes('/demo/budget')) {
      // Only stop onboarding if we're not on a budget route (preserve state during transitions)
      console.log('❌ Stopping onboarding - not on budget route');
      setState(prev => ({
        ...prev,
        currentStep: null,
        isActive: false,
        targetElement: null,
        tooltipContent: null
      }));
    }
  }, [location.pathname, location.search]); // React to route changes

  const startOnboarding = useCallback(() => {
    const nextStep = OnboardingService.getNextStep();
    if (nextStep !== null) {
      setState(prev => ({
        ...prev,
        currentStep: nextStep,
        isActive: true
      }));
    }
  }, []);

  const nextStep = useCallback(() => {
    if (state.currentStep !== null) {
      console.log('🎯 Completing step and advancing:', state.currentStep);
      OnboardingService.completeStep(state.currentStep);
      const next = OnboardingService.getNextStep();
      
      console.log('🎯 Next step after completion:', next);
      
      if (next !== null) {
        console.log('🎯 Advancing to next step:', next);
        setState(prev => ({
          ...prev,
          currentStep: next,
          isActive: true, // Ensure we stay active
          targetElement: null,
          tooltipContent: null
        }));
      } else {
        console.log('🎯 Onboarding completed, deactivating');
        setState(prev => ({
          ...prev,
          currentStep: null,
          isActive: false,
          targetElement: null,
          tooltipContent: null
        }));
      }
    }
  }, [state.currentStep]);

  const skipOnboarding = useCallback(() => {
    OnboardingService.skipOnboarding();
    setState({
      currentStep: null,
      isActive: false,
      targetElement: null,
      tooltipContent: null
    });
  }, []);

  const setTooltip = useCallback((target: string, content: string) => {
    setState(prev => ({
      ...prev,
      targetElement: target,
      tooltipContent: content
    }));
  }, []);

  const clearTooltip = useCallback(() => {
    setState(prev => ({
      ...prev,
      targetElement: null,
      tooltipContent: null
    }));
  }, []);

  const isStepCompleted = useCallback((step: OnboardingStep) => {
    return OnboardingService.isStepCompleted(step);
  }, []);

  const value = useMemo(() => ({
    state,
    startOnboarding,
    nextStep,
    skipOnboarding,
    setTooltip,
    clearTooltip,
    isStepCompleted
  }), [state, startOnboarding, nextStep, skipOnboarding, setTooltip, clearTooltip, isStepCompleted]);

  return (
    <OnboardingContext.Provider value={value}>
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