
import { useMemo } from "react";
import { AuthDemoStepCard } from "@/components/auth-demo/AuthDemoStepCard";

// Steps config used for generating step cards
const steps = [
  {
    title: "Step 1: Try Sign Up",
    description: "You'll receive a real email. Be sure to verify before returning.",
    ctaLabel: "Try Sign Up",
    to: "/signup?from=auth-demo"
  },
  {
    title: "Step 2: Try Login",
    description: "After verifying your email, log in using your new credentials.",
    ctaLabel: "Try Login",
    to: "/login"
  },
  {
    title: "Step 3: Try Password Reset",
    description: "Try resetting your password to see the full experience.",
    ctaLabel: "Try Password Reset",
    to: "/reset-password?from=auth-demo"
  }
];

export function useAuthDemoStepCards(demoStep: number, user: any, setLeadOpen: (v: boolean) => void) {
  // Returns step cards for AuthDemoLanding
  return useMemo(() => {
    const cards = [];
    if (demoStep === 0) {
      cards.push(
        <AuthDemoStepCard
          key="signup"
          step={1}
          title={steps[0].title}
          description={steps[0].description}
          ctaLabel={steps[0].ctaLabel}
          to={steps[0].to}
          highlight={true}
          disabled={false}
          done={false}
          className="mb-5"
          onClick={() => setLeadOpen(true)}
        />
      );
    }
    if (demoStep === 1) {
      cards.push(
        <AuthDemoStepCard
          key="signup"
          step={1}
          title={steps[0].title}
          description={steps[0].description}
          ctaLabel={steps[0].ctaLabel}
          to={steps[0].to}
          highlight={false}
          disabled={true}
          done={true}
          className="mb-5"
        />
      );
      cards.push(
        <AuthDemoStepCard
          key="login"
          step={2}
          title={steps[1].title}
          description={steps[1].description}
          ctaLabel={steps[1].ctaLabel}
          to={steps[1].to}
          highlight={true}
          disabled={false}
          done={false}
          className="mb-5"
        />
      );
    }
    if (demoStep >= 2) {
      cards.push(
        <AuthDemoStepCard
          key="signup"
          step={1}
          title={steps[0].title}
          description={steps[0].description}
          ctaLabel={steps[0].ctaLabel}
          to={steps[0].to}
          highlight={false}
          disabled={true}
          done={true}
          className="mb-5"
        />
      );
      cards.push(
        <AuthDemoStepCard
          key="login"
          step={2}
          title={steps[1].title}
          description={steps[1].description}
          ctaLabel={steps[1].ctaLabel}
          to={steps[1].to}
          highlight={false}
          disabled={true}
          done={true}
          className="mb-5"
        />
      );
      cards.push(
        <AuthDemoStepCard
          key="reset"
          step={3}
          title={steps[2].title}
          description="You've experienced the full authentication flow. Try resetting your password to see the end-to-end journey."
          ctaLabel={steps[2].ctaLabel}
          to={steps[2].to}
          highlight={demoStep === 2}
          disabled={false}
          done={demoStep > 2}
        />
      );
    }
    return cards;
  }, [demoStep, user, setLeadOpen]);
}
