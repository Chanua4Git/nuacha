
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link as RouterLink } from "react-router-dom";
import { AlertCircle, User, Key, Mail } from "lucide-react";

enum DemoStep {
  None,
  SignedUp,
  LoggedIn,
  Done
}

const demoStepDetails = [
  {
    label: "Try Sign Up",
    icon: <User className="w-4 h-4 mr-2" />,
    to: "/signup",
    explanation: "Start here to create a new (demo) user account."
  },
  {
    label: "Try Login",
    icon: <Key className="w-4 h-4 mr-2" />,
    to: "/login",
    explanation: "Log in with the account you just created."
  },
  {
    label: "Try Password Reset",
    icon: <Mail className="w-4 h-4 mr-2" />,
    to: "/reset-password",
    explanation: "Reset your (demo) account’s password here."
  }
];

function getStepEnabled(step: DemoStep, current: DemoStep) {
  // Only allow: 
  // Sign Up always enabled
  // Login enabled after Sign Up
  // Reset enabled after Login
  return (
    (step === DemoStep.None) || 
    (step === DemoStep.SignedUp) ||
    (step === DemoStep.LoggedIn)
  ) ? true : false;
}

const DEMO_LOCALSTORAGE_KEY = "authDemoDemoStep";

const initialDemoStep = (): DemoStep => {
  // Check if there's already a step in localStorage
  const stored = localStorage.getItem(DEMO_LOCALSTORAGE_KEY);
  if (!stored) return DemoStep.None;
  const num = Number(stored);
  return [DemoStep.None, DemoStep.SignedUp, DemoStep.LoggedIn, DemoStep.Done].includes(num as DemoStep) ? num as DemoStep : DemoStep.None;
};

const AuthDemoDemoCard = () => {
  const [step, setStep] = useState<DemoStep>(initialDemoStep);

  // For the UI logic, trigger step change when user clicks a button
  const handleClick = (dest: DemoStep) => {
    // We only ever progress forward
    const nextStep = dest > step ? dest : step;
    setStep(nextStep);
    localStorage.setItem(DEMO_LOCALSTORAGE_KEY, String(nextStep));
  };

  // UI - enable/disable logic for buttons
  const buttons = [
    {
      ...demoStepDetails[0],      // Sign Up
      enabled: true,
      step: DemoStep.SignedUp,
      explain: "Start by signing up to begin your demo journey."
    },
    {
      ...demoStepDetails[1],      // Login
      enabled: step >= DemoStep.SignedUp,
      step: DemoStep.LoggedIn,
      explain: step >= DemoStep.SignedUp
        ? "Now, log in with your new (demo) account."
        : "Please sign up first before logging in."
    },
    {
      ...demoStepDetails[2],      // Reset
      enabled: step >= DemoStep.LoggedIn,
      step: DemoStep.Done,
      explain: step >= DemoStep.LoggedIn
        ? "Finally, try resetting your (demo) password."
        : "First, sign up and log in to use this option."
    }
  ];

  // Jump to features section anchor
  const handleFeatureLink = () => {
    const elem = document.getElementById("auth-demo-features");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow p-8 md:p-10 my-8 w-full border border-gray-200">
      {/* Info Banner - same as demo */}
      <div className="mb-5 rounded-lg bg-accent/60 border border-accent/40 py-3 px-4 flex items-center gap-3 text-left text-muted-foreground text-sm">
        <AlertCircle className="h-5 w-5 text-[#5A7684]" />
        <div>
          <span className="font-medium">🔍 This demo is a preview of Nuacha’s authentication solution.</span>
          <br />No data is stored. All sessions are temporary and reset after logout or refresh.
        </div>
      </div>
      {/* Card Title/Subtext */}
      <h2 className="text-2xl font-playfair mb-2 text-center">Start the Demo</h2>
      <p className="mb-4 text-muted-foreground text-base text-center">
        Try the flows live — sign up, log in, and reset your password using our modular system.
      </p>
      <div className="flex flex-col md:flex-row gap-3 w-full mt-2">
        {buttons.map((btn, i) => (
          <Button
            asChild
            key={btn.label}
            className={`flex-1 ${!btn.enabled ? 'opacity-60 pointer-events-none' : ''}`}
            size="lg"
            variant="outline"
            tabIndex={btn.enabled ? 0 : -1}
            aria-disabled={!btn.enabled}
            onClick={() => handleClick(btn.step)}
          >
            <RouterLink to={btn.to}>
              {btn.icon}
              {btn.label}
            </RouterLink>
          </Button>
        ))}
      </div>
      <div className="mt-3 flex flex-col md:flex-row gap-2 text-sm text-center">
        {buttons.map((btn, i) => (
          <div key={btn.label} className="flex-1 min-w-0 text-muted-foreground">
            {btn.explain}
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Button variant="link" className="mt-6 text-primary text-base" onClick={handleFeatureLink}>
          Want to learn more about how this works? → Explore Auth Product Features
        </Button>
      </div>
    </section>
  );
};

export default AuthDemoDemoCard;
