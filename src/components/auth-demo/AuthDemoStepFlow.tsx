
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { toast } from "@/hooks/use-toast";
import AuthDemoStepCard from "./AuthDemoStepCard";

/**
 * Step metadata for the demo flow.
 */
const steps = [
  {
    title: "Step 1: Try Sign Up",
    description: "You’ll receive a real email. Be sure to verify before returning.",
    ctaLabel: "Try Sign Up",
    to: "/signup",
  },
  {
    title: "Step 2: Try Login",
    description: "After verifying your email, log in using your new credentials.",
    ctaLabel: "Try Login",
    to: "/login",
  },
  {
    title: "Step 3: Try Password Reset",
    description: "You've experienced the full authentication flow. Try resetting your password to see the end-to-end journey.",
    ctaLabel: "Try Password Reset",
    to: "/reset-password",
  },
];

function getDemoProgress() {
  const raw = localStorage.getItem("authDemo_step");
  let step = parseInt(raw ?? "0", 10);
  if (isNaN(step) || step < 0) step = 0;
  if (step > 3) step = 3;
  return step;
}

function setDemoProgress(step: number) {
  localStorage.setItem("authDemo_step", String(step));
}

const getVerifiedFromSearch = (search: string) => {
  try {
    const params = new URLSearchParams(search);
    return params.get("verified") === "true";
  } catch {
    return false;
  }
};

type AuthDemoStepFlowProps = {
  locationSearch: string;
};

/**
 * A guided, step-by-step flow for the authentication demo,
 * with proper cues for current/progressed steps, handling post-verification logic.
 */
const AuthDemoStepFlow = ({ locationSearch }: AuthDemoStepFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 0: signup, 1: login, 2: reset, 3: done
  const [demoStep, setDemoStep] = useState(() => getDemoProgress());
  const [justVerified, setJustVerified] = useState(() =>
    getVerifiedFromSearch(locationSearch)
  );

  // Listen for ?verified=true param and step up progress
  useEffect(() => {
    if (justVerified) {
      setDemoStep(1);
      setDemoProgress(1);
      toast({
        title: "You’re verified!",
        description: "Now try logging in with your new account.",
      });
      // Remove ?verified=true from URL for cleanliness
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, document.title, url.pathname);
      setJustVerified(false);
    }
    // eslint-disable-next-line
  }, [locationSearch]);

  // Progress to reset after login
  useEffect(() => {
    if (user && demoStep < 2) {
      setDemoStep(2);
      setDemoProgress(2);
      toast({
        title: "All set. You’re logged in.",
        description: "Try resetting your password next.",
      });
    }
    // eslint-disable-next-line
  }, [user]);

  // For development/testing, enable manual step switching if needed (not exposed in UI)
  const setStep = (step: number) => {
    setDemoStep(step);
    setDemoProgress(step);
  };

  // Sequential step cards
  const stepCards = useMemo(() => {
    const cards: JSX.Element[] = [];
    // Step 1: Sign Up
    cards.push(
      <AuthDemoStepCard
        key="signup"
        step={1}
        title={steps[0].title}
        description={steps[0].description}
        ctaLabel={steps[0].ctaLabel}
        to={steps[0].to}
        highlight={demoStep === 0}
        disabled={demoStep > 0}
        done={demoStep > 0}
        className="mb-5"
      />
    );
    // Step 2: Login (enabled after verified)
    if (demoStep > 0) {
      cards.push(
        <AuthDemoStepCard
          key="login"
          step={2}
          title={steps[1].title}
          description={steps[1].description}
          ctaLabel={steps[1].ctaLabel}
          to={steps[1].to}
          highlight={demoStep === 1}
          disabled={demoStep < 1 || demoStep > 1}
          done={demoStep > 1}
          className="mb-5"
        />
      );
    }
    // Step 3: Password Reset (enabled after login)
    if (user && demoStep > 1) {
      cards.push(
        <AuthDemoStepCard
          key="reset"
          step={3}
          title={steps[2].title}
          description={steps[2].description}
          ctaLabel={steps[2].ctaLabel}
          to={steps[2].to}
          highlight={demoStep === 2}
          disabled={demoStep < 2}
          done={demoStep > 2}
        />
      );
    }
    return cards;
  }, [demoStep, user]);

  return (
    <section
      className="flex flex-col items-center w-full px-2 sm:px-4 py-4 max-w-2xl mx-auto"
      aria-label="auth demo step by step flow"
    >
      <div className="w-full">{stepCards}</div>
      <div className="flex justify-center w-full mt-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            const elem = document.getElementById("auth-demo-features");
            if (elem) {
              elem.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="text-primary underline-offset-4 hover:underline text-base font-medium tracking-tight mt-4"
          style={{ outline: "none", background: "none", border: "none" }}
        >
          Want to learn more about how this works? → Explore Auth Product Features
        </button>
      </div>
    </section>
  );
};

export default AuthDemoStepFlow;
