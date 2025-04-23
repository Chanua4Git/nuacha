import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthDemoService, AuthDemoStep } from '../services/AuthDemoService';
import { toast } from 'sonner';
import { supabaseClient } from '../utils/supabaseClient';

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
  const [demoStep, setDemoStepState] = useState<AuthDemoStep>(AuthDemoService.getCurrentStep());
  const [isDemoVerified, setIsDemoVerified] = useState<boolean>(false);
  const location = useLocation();

  const setDemoStep = (step: AuthDemoStep) => {
    AuthDemoService.setCurrentStep(step);
    setDemoStepState(step);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isVerified = searchParams.get("verified") === "true";
    const isFromAuthDemo = searchParams.get("from") === "auth-demo";

    if (isVerified && isFromAuthDemo) {
      setIsDemoVerified(true);
      
      if (demoStep === AuthDemoStep.Initial) {
        setDemoStep(AuthDemoStep.SignedUp);
        supabaseClient.auth.signOut().then(() => {
          toast.success("You're in the demo now!", {
            description: "You've created a new account. Try logging in now."
          });
        });
      }
      
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("verified");
        window.history.replaceState({}, document.title, url.toString());
      }, 500);
    }
  }, [location.search, demoStep]);

  const resetDemo = () => {
    AuthDemoService.resetDemo();
    setDemoStepState(AuthDemoStep.Initial);
    setIsDemoVerified(false);
    toast.success("Demo reset successfully", {
      description: "You can now start the demo from the beginning."
    });
  };

  const setVerificationEmail = (email: string) => {
    AuthDemoService.setDemoEmail(email);
    AuthDemoService.setVerificationPending(true);
  };

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
