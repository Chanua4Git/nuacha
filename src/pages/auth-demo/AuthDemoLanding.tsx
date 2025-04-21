
import { useLocation } from "react-router-dom";
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import AuthDemoHero from "@/components/auth-demo/AuthDemoHero";
import AuthDemoStepFlow from "@/components/auth-demo/AuthDemoStepFlow";
import AuthDemoFeatureBreakdown from "@/components/auth-demo/AuthDemoFeatureBreakdown";
import AuthDemoPlansSection from "@/components/auth-demo/AuthDemoPlansSection";

// The main landing page for /auth-demo
const AuthDemoLanding = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Breadcrumbs now above Hero */}
      <AuthDemoBreadcrumbs currentPage="landing" />

      {/* Hero section */}
      <AuthDemoHero />

      {/* Step-by-step guided demo flow */}
      <AuthDemoStepFlow locationSearch={location.search} />

      {/* Features breakdown */}
      <AuthDemoFeatureBreakdown />

      {/* Plans section at the bottom */}
      <AuthDemoPlansSection />
    </div>
  );
};

export default AuthDemoLanding;
