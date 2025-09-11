import { OnboardingService } from '@/services/OnboardingService';

/**
 * Development helper to reset onboarding state
 * Can be called from browser console: window.resetOnboarding()
 */
export const resetOnboardingState = () => {
  OnboardingService.resetOnboarding();
  console.log('🔄 Onboarding state has been reset. Refresh the page to see onboarding again.');
  
  // Also show current localStorage state for debugging
  console.log('📊 Current localStorage onboarding keys:', {
    completed: localStorage.getItem('nuacha_onboarding_completed'),
    skipped: localStorage.getItem('nuacha_onboarding_skipped'),
    currentStep: localStorage.getItem('nuacha_onboarding_current_step')
  });
};

/**
 * Development helper to show current onboarding state
 */
export const debugOnboardingState = () => {
  console.log('🎯 Current onboarding state:', {
    shouldShow: OnboardingService.shouldShowOnboarding(),
    nextStep: OnboardingService.getNextStep(),
    isCompleted: OnboardingService.isOnboardingCompleted(),
    isSkipped: OnboardingService.isOnboardingSkipped(),
    completedSteps: OnboardingService.getCompletedSteps(),
    currentPath: window.location.pathname
  });
};

// Make helpers available globally for development
if (typeof window !== 'undefined') {
  (window as any).resetOnboarding = resetOnboardingState;
  (window as any).debugOnboarding = debugOnboardingState;
}