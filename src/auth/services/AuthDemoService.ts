
/**
 * AuthDemoService - Manages the auth demo flow state and transitions
 * Provides centralized control of the demo state to prevent race conditions
 */

// Demo steps enum to track progress
export enum AuthDemoStep {
  Initial = 0,
  SignedUp = 1,
  LoggedIn = 2,
  ResetPassword = 3,
  Completed = 4,
}

// Local storage keys
const AUTH_DEMO_STEP_KEY = "authDemo_step";
const AUTH_DEMO_EMAIL_KEY = "authDemo_email";
const VERIFICATION_PENDING_KEY = "authDemo_verification_pending";

export class AuthDemoService {
  /**
   * Gets the current step in the auth demo flow
   */
  static getCurrentStep(): AuthDemoStep {
    const raw = localStorage.getItem(AUTH_DEMO_STEP_KEY);
    const step = parseInt(raw ?? "0", 10);
    if (isNaN(step) || step < 0) return AuthDemoStep.Initial;
    if (step > AuthDemoStep.Completed) return AuthDemoStep.Completed;
    return step as AuthDemoStep;
  }

  /**
   * Sets the current step in the auth demo flow
   */
  static setCurrentStep(step: AuthDemoStep): void {
    localStorage.setItem(AUTH_DEMO_STEP_KEY, String(step));
  }

  /**
   * Reset the demo flow back to the initial state
   */
  static resetDemo(): void {
    localStorage.removeItem(AUTH_DEMO_STEP_KEY);
    localStorage.removeItem(AUTH_DEMO_EMAIL_KEY);
    localStorage.removeItem(VERIFICATION_PENDING_KEY);
  }

  /**
   * Store the email used in the demo for continuity
   */
  static setDemoEmail(email: string): void {
    localStorage.setItem(AUTH_DEMO_EMAIL_KEY, email);
  }

  /**
   * Get the email used in the demo
   */
  static getDemoEmail(): string | null {
    return localStorage.getItem(AUTH_DEMO_EMAIL_KEY);
  }

  /**
   * Mark that a verification email has been sent
   */
  static setVerificationPending(isPending: boolean): void {
    if (isPending) {
      localStorage.setItem(VERIFICATION_PENDING_KEY, "true");
    } else {
      localStorage.removeItem(VERIFICATION_PENDING_KEY);
    }
  }

  /**
   * Check if verification is pending
   */
  static isVerificationPending(): boolean {
    return localStorage.getItem(VERIFICATION_PENDING_KEY) === "true";
  }

  /**
   * Advance to the next step if conditions are met
   */
  static advanceToNextStep(currentStep: AuthDemoStep): AuthDemoStep {
    const nextStep = currentStep + 1;
    AuthDemoService.setCurrentStep(nextStep as AuthDemoStep);
    return nextStep as AuthDemoStep;
  }

  /**
   * Get a formatted URL for signup page in demo mode
   */
  static getSignupUrl(): string {
    return "/signup?from=auth-demo";
  }

  /**
   * Get a formatted URL for login page in demo mode
   */
  static getLoginUrl(): string {
    return "/login?from=auth-demo";
  }

  /**
   * Get a formatted URL for password reset page in demo mode
   */
  static getResetPasswordUrl(): string {
    return "/reset-password?from=auth-demo";
  }

  /**
   * Get the redirect URL for after email verification
   * Make sure to redirect to /auth-demo with hash
   */
  static getVerificationRedirectUrl(): string {
    return `${window.location.origin}/auth-demo?from=auth-demo&verified=true#verified`;
  }
}
