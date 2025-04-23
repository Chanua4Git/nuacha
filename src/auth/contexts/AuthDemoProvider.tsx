
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthDemoService, AuthDemoStep } from '../services/AuthDemoService';
import { toast } from 'sonner';

type AuthDemoContextType = {
  demoStep: AuthDemoStep;
  setDemoStep: (step: AuthDemoStep) => void;
  resetDemo: () => void;
  demoActive: boolean;
  isDemoVerified: boolean;
  verificationEmail: string | null;
  setVerificationEmail: (email: string) => void;
};

const AuthDemoContext = createContext<AuthDemoContextType>({
  demoStep: AuthDemoStep.Initial,
  setDemoStep: () => {},
  resetDemo: () => {},
  demoActive: false,
  isDemoVerified: false,
  verificationEmail: null,
  setVerificationEmail: () => {},
});

export const useAuthDemo = () => useContext(AuthDemoContext);

export const AuthDemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [demoStep, setDemoStepState] = useState<AuthDemoStep>(AuthDemoService.getCurrentStep());
  const [isDemoVerified, setIsDemoVerified] = useState<boolean>(false);
  const location = useLocation();

  // Persist demo step changes to localStorage - define this function early
  const setDemoStep = (step: AuthDemoStep) => {
    AuthDemoService.setCurrentStep(step);
    setDemoStepState(step);
  };

  // Check URL parameters for verification status
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isVerified = searchParams.get("verified") === "true";
    const isFromAuthDemo = searchParams.get("from") === "auth-demo";

    if (isVerified && isFromAuthDemo) {
      setIsDemoVerified(true);
      
      // Handle verification completion
      if (demoStep === AuthDemoStep.Initial) {
        setDemoStep(AuthDemoStep.SignedUp);
        toast.success("✅ Email verified!", {
          description: "You're in the demo now. Try logging in with your new account."
        });
      }
      
      // Clean URL params after processing
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("verified");
        window.history.replaceState({}, document.title, url.toString());
      }, 500);
    }
  }, [location.search, demoStep]);

  // Reset the entire demo state
  const resetDemo = () => {
    AuthDemoService.resetDemo();
    setDemoStepState(AuthDemoStep.Initial);
    setIsDemoVerified(false);
    toast.success("Demo reset successfully", {
      description: "You can now start the demo from the beginning."
    });
  };

  // Set the email used for verification
  const setVerificationEmail = (email: string) => {
    AuthDemoService.setDemoEmail(email);
    AuthDemoService.setVerificationPending(true);
  };

  // Check if the demo is active based on URL or localStorage
  const isDemoActive = () => {
    return demoStep > AuthDemoStep.Initial || 
           location.pathname.startsWith('/auth-demo') || 
           location.search.includes('from=auth-demo');
  };

  const contextValue = {
    demoStep,
    setDemoStep,
    resetDemo,
    demoActive: isDemoActive(),
    isDemoVerified,
    verificationEmail: AuthDemoService.getDemoEmail(),
    setVerificationEmail,
  };

  return (
    <AuthDemoContext.Provider value={contextValue}>
      {children}
    </AuthDemoContext.Provider>
  );
};
