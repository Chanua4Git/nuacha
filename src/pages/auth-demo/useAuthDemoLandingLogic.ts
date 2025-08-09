
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { toast } from "sonner";
import { useAuthDemo } from "@/auth/contexts/AuthDemoProvider";
import { AuthDemoService, AuthDemoStep } from "@/auth/services/AuthDemoService";

export function useAuthDemoLandingLogic() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { demoStep, setDemoStep, isDemoVerified, resetDemo } = useAuthDemo();

  const [leadOpen, setLeadOpen] = useState(false);

  // Effect: when user is signed in, update step
  useEffect(() => {
    if (user && demoStep < AuthDemoStep.LoggedIn) {
      setDemoStep(AuthDemoStep.LoggedIn);
    }
  }, [user, demoStep, setDemoStep]);

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
    handleResetDemo: resetDemo,
    handleFeatureClick,
    setDemoStep
  };
}
