
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { toast } from "sonner";
import {
  getVerifiedFromSearch,
  getResetSuccessFromSearch,
  getDemoProgress,
  setDemoProgress,
  clearAuthDemo,
} from "@/auth/utils/authDemoHelpers";

export function useAuthDemoLandingLogic() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [demoStep, setDemoStep] = useState(() => getDemoProgress());
  const [justVerified, setJustVerified] = useState(() => getVerifiedFromSearch(location.search));
  const [justReset, setJustReset] = useState(() => getResetSuccessFromSearch(location.search));
  const [leadOpen, setLeadOpen] = useState(false);

  // Effect: handle just verified
  useEffect(() => {
    if (justVerified) {
      setDemoStep(1);
      setDemoProgress(1);
      toast.success("✅ Email verified!", {
        description: "You're in the demo now. Now try logging in with your new account."
      });
      // Clean URL after param processed
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, document.title, url.pathname);
      setJustVerified(false);
    }
  }, [justVerified, location.search]);

  // Effect: handle just reset
  useEffect(() => {
    if (justReset) {
      setDemoStep(3);
      setDemoProgress(3);
      toast.success("🔐 Password reset complete!", {
        description: "You've completed the authentication demo. Try logging in."
      });
      // Clean URL after param processed
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
  }, [user]);

  // Handler for resetting the demo
  const handleResetDemo = async () => {
    try {
      clearAuthDemo();
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
