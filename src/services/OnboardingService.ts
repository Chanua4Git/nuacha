export enum OnboardingStep {
  GUIDE_TO_BUILDER = 'guide_to_builder',
  TEMPLATE_SELECTION = 'template_selection',
  TEMPLATE_ENCOURAGEMENT = 'template_encouragement',
  ABOUT_YOU_NEXT = 'about_you_next'
}

const ONBOARDING_STORAGE_KEY = 'nuacha_onboarding_completed';
const ONBOARDING_STEP_KEY = 'nuacha_onboarding_current_step';
const ONBOARDING_SKIPPED_KEY = 'nuacha_onboarding_skipped';

export class OnboardingService {
  /**
   * Check if onboarding should be shown based on current conditions
   */
  static shouldShowOnboarding(): boolean {
    // Don't show if user has completed or skipped onboarding
    if (this.isOnboardingCompleted() || this.isOnboardingSkipped()) {
      return false;
    }

    // Only show onboarding on demo/budget routes
    const currentPath = window.location.pathname;
    const isOnBudgetRoute = currentPath.includes('/demo/budget') || currentPath.includes('/budget') || currentPath === '/';
    
    console.log('🎯 OnboardingService shouldShowOnboarding:', {
      currentPath,
      isOnBudgetRoute,
      isCompleted: this.isOnboardingCompleted(),
      isSkipped: this.isOnboardingSkipped()
    });
    
    return isOnBudgetRoute;
  }

  /**
   * Get the next step that should be shown
   */
  static getNextStep(): OnboardingStep | null {
    if (this.isOnboardingCompleted() || this.isOnboardingSkipped()) {
      return null;
    }

    // Check which steps are completed
    const completedSteps = this.getCompletedSteps();
    
    // Return first incomplete step
    const allSteps = [
      OnboardingStep.GUIDE_TO_BUILDER,
      OnboardingStep.TEMPLATE_SELECTION,
      OnboardingStep.TEMPLATE_ENCOURAGEMENT,
      OnboardingStep.ABOUT_YOU_NEXT
    ];

    for (const step of allSteps) {
      if (!completedSteps.includes(step)) {
        return step;
      }
    }

    return null;
  }

  /**
   * Mark a step as completed
   */
  static completeStep(step: OnboardingStep): void {
    const completedSteps = this.getCompletedSteps();
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(completedSteps));
    }

    // If all steps are completed, mark onboarding as done
    const allSteps = [
      OnboardingStep.GUIDE_TO_BUILDER,
      OnboardingStep.TEMPLATE_SELECTION,
      OnboardingStep.TEMPLATE_ENCOURAGEMENT,
      OnboardingStep.ABOUT_YOU_NEXT
    ];

    if (allSteps.every(s => completedSteps.includes(s))) {
      this.markOnboardingCompleted();
    }
  }

  /**
   * Check if a specific step is completed
   */
  static isStepCompleted(step: OnboardingStep): boolean {
    const completedSteps = this.getCompletedSteps();
    return completedSteps.includes(step);
  }

  /**
   * Get all completed steps
   */
  static getCompletedSteps(): OnboardingStep[] {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if onboarding is completely finished
   */
  static isOnboardingCompleted(): boolean {
    const completedSteps = this.getCompletedSteps();
    const allSteps = [
      OnboardingStep.GUIDE_TO_BUILDER,
      OnboardingStep.TEMPLATE_SELECTION,
      OnboardingStep.TEMPLATE_ENCOURAGEMENT,
      OnboardingStep.ABOUT_YOU_NEXT
    ];
    
    return allSteps.every(step => completedSteps.includes(step));
  }

  /**
   * Mark entire onboarding as completed
   */
  static markOnboardingCompleted(): void {
    const allSteps = [
      OnboardingStep.GUIDE_TO_BUILDER,
      OnboardingStep.TEMPLATE_SELECTION,
      OnboardingStep.TEMPLATE_ENCOURAGEMENT,
      OnboardingStep.ABOUT_YOU_NEXT
    ];
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(allSteps));
  }

  /**
   * Skip the entire onboarding process
   */
  static skipOnboarding(): void {
    localStorage.setItem(ONBOARDING_SKIPPED_KEY, 'true');
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
  }

  /**
   * Check if onboarding was skipped
   */
  static isOnboardingSkipped(): boolean {
    return localStorage.getItem(ONBOARDING_SKIPPED_KEY) === 'true';
  }

  /**
   * Reset onboarding (useful for testing)
   */
  static resetOnboarding(): void {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    localStorage.removeItem(ONBOARDING_SKIPPED_KEY);
  }

  /**
   * Get content for a specific step
   */
  static getStepContent(step: OnboardingStep): { content: string; position: 'top' | 'bottom' | 'left' | 'right' } {
    switch (step) {
      case OnboardingStep.GUIDE_TO_BUILDER:
        return {
          content: "Click Build Your Budget to continue. I'll stay here until you do.",
          position: 'bottom'
        };
      case OnboardingStep.TEMPLATE_SELECTION:
        return {
          content: "🎯 Choose the template that best matches your family situation, or request a custom one if needed!",
          position: 'bottom'
        };
      case OnboardingStep.TEMPLATE_ENCOURAGEMENT:
        return {
          content: "✨ Designed specifically for single parents managing real-world expenses",
          position: 'bottom'
        };
      case OnboardingStep.ABOUT_YOU_NEXT:
        return {
          content: "Complete the form and click Next to continue. I'll stay here until you do.",
          position: 'bottom'
        };
      default:
        return {
          content: "",
          position: 'bottom'
        };
    }
  }

  /**
   * Get target element selector for a step
   */
  static getStepTarget(step: OnboardingStep): string {
    switch (step) {
      case OnboardingStep.GUIDE_TO_BUILDER:
        return '[data-onboarding="build-button"]';
      case OnboardingStep.TEMPLATE_SELECTION:
        return '[data-onboarding="template-dropdown"]';
      case OnboardingStep.TEMPLATE_ENCOURAGEMENT:
        return '[data-onboarding="template-encouragement"]';
      case OnboardingStep.ABOUT_YOU_NEXT:
        return '[data-onboarding="about-you-next"]';
      default:
        return '';
    }
  }
}