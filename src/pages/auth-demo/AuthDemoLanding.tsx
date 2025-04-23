
import { LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import AuthDemoHero from "@/components/auth-demo/AuthDemoHero";
import AuthDemoFeatureBreakdown from "@/components/auth-demo/AuthDemoFeatureBreakdown";
import AuthDemoPlansSection from "@/components/auth-demo/AuthDemoPlansSection";
import AuthDemoLeadCaptureModal from "@/components/auth-demo/AuthDemoLeadCaptureModal";
import { useAuthDemoLandingLogic } from "./useAuthDemoLandingLogic";
import { useAuthDemo } from "@/auth/contexts/AuthDemoProvider";

const AuthDemoLanding = () => {
  const {
    setLeadOpen,
    leadOpen,
    user,
    signOut,
    handleResetDemo,
    handleFeatureClick,
  } = useAuthDemoLandingLogic();
  
  // Use the updated hook from our AuthDemoProvider
  const { demoStep } = useAuthDemo();
  
  // Use the updated step cards hook
  const stepCards = useAuthDemoStepCards(user, setLeadOpen);

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
