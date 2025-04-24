import { useEffect } from "react";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthDemoStepCard } from "@/components/auth-demo/AuthDemoStepCard";
import { toast } from "sonner";
import { AuthDemoService, AuthDemoStep } from "@/auth/services/AuthDemoService";
import { useAuthDemo } from "@/auth/contexts/AuthDemoProvider";
import { Button } from "@/components/ui/button";

export const AuthDemoSteps = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { demoStep, setDemoStep, isDemoVerified } = useAuthDemo();
  
  const isVerified = new URLSearchParams(location.search).get("verified") === "true";
  const isFromAuthDemo = new URLSearchParams(location.search).get("from") === "auth-demo";

  useEffect(() => {
    if (isVerified && isFromAuthDemo) {
      toast.success("You're in the demo now!", {
        description: "You've created a new account. Try logging in now."
      });
      
      if (demoStep < AuthDemoStep.SignedUp) {
        setDemoStep(AuthDemoStep.SignedUp);
      }
    }
  }, [isVerified, isFromAuthDemo, demoStep, setDemoStep]);

  useEffect(() => {
    if (user && demoStep === AuthDemoStep.SignedUp) {
      setDemoStep(AuthDemoStep.LoggedIn);
      toast.success("Successfully logged in!", {
        description: "Try the password reset feature to complete the demo."
      });
    }
  }, [user, demoStep, setDemoStep]);

  const shouldShow = demoStep > AuthDemoStep.Initial || isFromAuthDemo || isVerified;
  if (!shouldShow) {
    return null;
  }

  const handleStep = (path: string) => {
    navigate(path);
  };

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair mb-4">
            {demoStep >= AuthDemoStep.Completed 
              ? "Demo Completed!" 
              : "Try Our Authentication Demo"}
          </h2>
          <p className="text-muted-foreground">
            {demoStep >= AuthDemoStep.Completed 
              ? "You've experienced our secure authentication system. Ready to explore our solutions?"
              : "Experience our secure and user-friendly authentication system"}
          </p>
          {demoStep >= AuthDemoStep.Completed && (
            <Button 
              onClick={() => navigate("/auth-demo/plans")}
              className="mt-6"
              size="lg"
            >
              View Our Solutions
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AuthDemoStepCard
            step={1}
            title="Step 1: Try Sign Up"
            description="You'll receive a real email. Be sure to verify before returning."
            ctaLabel="Try Sign Up"
            to={AuthDemoService.getSignupUrl()}
            disabled={user !== null || demoStep >= AuthDemoStep.SignedUp}
            done={user !== null || demoStep >= AuthDemoStep.SignedUp}
            highlight={demoStep === AuthDemoStep.Initial}
            onClick={() => handleStep(AuthDemoService.getSignupUrl())}
          />
          
          <AuthDemoStepCard
            step={2}
            title="Step 2: Try Login"
            description="After verifying your email, log in using your new credentials."
            ctaLabel="Try Login"
            to="/login"
            disabled={demoStep < AuthDemoStep.SignedUp || user !== null}
            done={user !== null || demoStep > AuthDemoStep.LoggedIn}
            highlight={demoStep === AuthDemoStep.SignedUp && !user}
            onClick={() => handleStep("/login")}
            showSignOut={user !== null && (demoStep === AuthDemoStep.SignedUp || demoStep === AuthDemoStep.LoggedIn)}
          />
          
          <AuthDemoStepCard
            step={3}
            title="Step 3: Try Password Reset"
            description="Try resetting your password to see the full experience."
            ctaLabel="Try Password Reset"
            to={AuthDemoService.getResetPasswordUrl()}
            disabled={!user || demoStep < AuthDemoStep.LoggedIn}
            done={demoStep >= AuthDemoStep.Completed}
            highlight={user !== null && demoStep === AuthDemoStep.LoggedIn}
            onClick={() => handleStep(AuthDemoService.getResetPasswordUrl())}
          />
        </div>
      </div>
    </section>
  );
};
