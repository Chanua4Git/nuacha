
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthDemoStepCard } from "@/components/auth-demo/AuthDemoStepCard";
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import AuthDemoFeatureBreakdown from "@/components/auth-demo/AuthDemoFeatureBreakdown";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { toast } from "@/hooks/use-toast";

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
    description: "Try resetting your password to see the full experience.",
    ctaLabel: "Try Password Reset",
    to: "/reset-password",
  },
];

// Simple local demo progress tracker
function getDemoProgress() {
  // 0 - signup, 1 - login, 2 - reset, 3 - done
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

const AuthDemoLanding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Track the demo step (0: signup, 1: login, 2: reset, 3: done)
  const [demoStep, setDemoStep] = useState(() => getDemoProgress());
  const [justVerified, setJustVerified] = useState(() =>
    getVerifiedFromSearch(location.search)
  );

  // On verification complete - step up to Login
  useEffect(() => {
    // Only run if arrived with ?verified=true
    if (justVerified) {
      setDemoStep(1);
      setDemoProgress(1);
      toast({
        title: "You're verified!",
        description: "Now try logging in with your new account.",
      });

      // Remove ?verified=true from URL for cleanliness
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, document.title, url.pathname);

      setJustVerified(false);
    }
  // intentionally not adding setJustVerified as dep
  // eslint-disable-next-line
  }, [location.search]);

  // When user logs in, step up to Password Reset
  useEffect(() => {
    if (user && demoStep < 2) {
      setDemoStep(2);
      setDemoProgress(2);
    }
  }, [user]); // don't include demoStep, avoid re-entry on rerenders

  // Handle demo progression for local testing convenience
  const handleStepClick = (i: number) => {
    setDemoStep(i);
    setDemoProgress(i);
  };

  // Responsive stack for steps
  const stepCards = useMemo(() => {
    const cards = [];
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
    // Step 2: Login
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
    // Step 3: Password Reset
    if (user && demoStep > 1) {
      cards.push(
        <AuthDemoStepCard
          key="reset"
          step={3}
          title={steps[2].title}
          description="You've experienced the full authentication flow. Try resetting your password to see the end-to-end journey."
          ctaLabel={steps[2].ctaLabel}
          to={steps[2].to}
          highlight={demoStep === 2}
          disabled={demoStep < 2}
          done={demoStep > 2}
        />
      );
    }
    return cards;
    // eslint-disable-next-line
  }, [demoStep, user]);

  // Scroll to features handler
  const handleFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById("auth-demo-features");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <AuthDemoBreadcrumbs currentPage="landing" />
      <section className="flex flex-col items-center w-full px-2 sm:px-4 py-4 max-w-2xl mx-auto">
        <div className="w-full">
          {stepCards}
        </div>
        <div className="flex justify-center w-full mt-2">
          <button
            onClick={handleFeatureClick}
            className="text-primary underline-offset-4 hover:underline text-base font-medium tracking-tight mt-4"
            style={{ outline: "none", background: "none", border: "none" }}
          >
            Want to learn more about how this works? → Explore Auth Product Features
          </button>
        </div>
      </section>
      <AuthDemoFeatureBreakdown />
    </div>
  );
};

export default AuthDemoLanding;

