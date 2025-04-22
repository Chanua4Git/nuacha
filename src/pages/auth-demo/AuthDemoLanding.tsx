import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthDemoStepCard } from "@/components/auth-demo/AuthDemoStepCard";
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import AuthDemoFeatureBreakdown from "@/components/auth-demo/AuthDemoFeatureBreakdown";
import AuthDemoHero from "@/components/auth-demo/AuthDemoHero";
import AuthDemoPlansSection from "@/components/auth-demo/AuthDemoPlansSection";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { toast } from "sonner";
import AuthDemoLeadCaptureModal from "@/components/auth-demo/AuthDemoLeadCaptureModal";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";

const steps = [
  {
    title: "Step 1: Try Sign Up",
    description: "You'll receive a real email. Be sure to verify before returning.",
    ctaLabel: "Try Sign Up",
    // Always use from=auth-demo so the signup flow triggers redirect to /auth-demo
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
    // Always include the from=auth-demo query for reset as well.
    to: "/reset-password?from=auth-demo"
  }
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

// The core function to detect if redirected for verification
const getVerifiedFromSearch = (search: string) => {
  try {
    const params = new URLSearchParams(search);
    // Only counts as demo verification if verified=true is set
    return params.get("verified") === "true";
  } catch {
    return false;
  }
};

const getResetSuccessFromSearch = (search: string) => {
  try {
    const params = new URLSearchParams(search);
    // For demo: reset must be success
    return params.get("reset") === "success";
  } catch {
    return false;
  }
};

const AuthDemoLanding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // The core state logic to track demo progress
  const [demoStep, setDemoStep] = useState(() => getDemoProgress());
  // For detecting redirect after verification in the demo flow
  const [justVerified, setJustVerified] = useState(() =>
    getVerifiedFromSearch(location.search)
  );
  const [justReset, setJustReset] = useState(() =>
    getResetSuccessFromSearch(location.search)
  );

  const [leadOpen, setLeadOpen] = useState(false);

  useEffect(() => {
    // If redirected after email verification in demo mode
    if (justVerified) {
      setDemoStep(1);
      setDemoProgress(1);
      toast("You're verified!", {
        description: "Now try logging in with your new account."
      });

      // Clean up URL so query param doesn't persist
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, document.title, url.pathname);

      setJustVerified(false);
    }
  }, [justVerified, location.search]);

  useEffect(() => {
    // After demo reset password completion, i.e. redirected to /auth-demo?reset=success
    if (justReset) {
      setDemoStep(3);
      setDemoProgress(3);
      toast("Password reset complete!", {
        description: "You've completed the authentication demo. Thank you!"
      });

      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      window.history.replaceState({}, document.title, url.pathname);

      setJustReset(false);
    }
  }, [justReset, location.search]);

  // When user logs in, progress demo to step 2 if appropriate
  useEffect(() => {
    if (user && demoStep < 2) {
      setDemoStep(2);
      setDemoProgress(2);
    }
  }, [user]);

  const stepCards = useMemo(() => {
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
  }, [demoStep, user]);

  const handleFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById("auth-demo-features");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleResetDemo = async () => {
    try {
      localStorage.removeItem("authDemo_step");
      setDemoStep(0);
      setDemoProgress(0);

      if (user) {
        await signOut();
      }

      toast.success("Demo reset successfully", {
        description: "You can now start the demo from the beginning."
      });
    } catch (error) {
      console.error("Error resetting demo:", error);
      toast.error("Could not reset demo", {
        description: "Please try again or refresh the page."
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <AuthDemoBreadcrumbs currentPage="landing" />
      <AuthDemoHero />
      <section className="flex flex-col items-center w-full px-2 sm:px-4 py-4 max-w-2xl mx-auto">
        <div className="w-full flex justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Demo
          </Button>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          )}
        </div>

        <div className="w-full flex flex-col items-center">
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
      <AuthDemoPlansSection />
      <AuthDemoLeadCaptureModal open={leadOpen} onOpenChange={setLeadOpen} />
    </div>
  );
};

export default AuthDemoLanding;
