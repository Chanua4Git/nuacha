
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { toast } from "sonner";
import { getVerifiedFromSearch, getResetSuccessFromSearch } from "@/auth/utils/authDemoHelpers";

export function useAuthDemoLandingLogic() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [demoStep, setDemoStep] = useState(() => getDemoProgress());
  const [justVerified, setJustVerified] = useState(() => getVerifiedFromSearch(location.search));
  const [justReset, setJustReset] = useState(() => getResetSuccessFromSearch(location.search));
  const [leadOpen, setLeadOpen] = useState(false);

  // Helpers for localStorage step progress
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

  // Effect: handle just verified
  useEffect(() => {
    if (justVerified) {
      setDemoStep(1);
      setDemoProgress(1);
      toast.success("✅ Email verified!", {
        description: "You're in the demo now. Now try logging in with your new account."
      });
      
      // If user is already authenticated, redirect to dashboard with verified flag
      if (user) {
        const url = new URL(window.location.href);
        url.searchParams.delete("verified");
        url.pathname = "/dashboard";
        url.searchParams.set("verified", "true");
        navigate(url.toString(), { replace: true });
      } else {
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("verified");
        window.history.replaceState({}, document.title, url.pathname);
      }
      setJustVerified(false);
    }
  }, [justVerified, location.search, user, navigate]);

  // Effect: handle just reset
  useEffect(() => {
    if (justReset) {
      setDemoStep(3);
      setDemoProgress(3);
      toast.success("🔐 Password reset complete!", {
        description: "You've completed the authentication demo. Try logging in."
      });
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      window.history.replaceState({}, document.title, url.pathname);
      setJustReset(false);
    }
  }, [justReset, location.search]);

  // Effect: when user is signed in, update step
  useEffect(() => {
    if (user && demoStep < 2) {
      setDemoStep(2);
      setDemoProgress(2);
    }
  }, [user, demoStep]);

  // Handler for resetting the demo
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

  // Handler for feature anchor scroll
  const handleFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById("auth-demo-features");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return {
    demoStep,
    setLeadOpen,
    leadOpen,
    user,
    signOut,
    handleResetDemo,
    handleFeatureClick,
    setDemoStep
  };
}
