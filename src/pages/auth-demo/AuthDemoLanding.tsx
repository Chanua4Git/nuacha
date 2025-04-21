
import AuthDemoHero from "@/components/auth-demo/AuthDemoHero";
import AuthDemoFeatureBreakdown from "@/components/auth-demo/AuthDemoFeatureBreakdown";
import AuthDemoPlansSection from "@/components/auth-demo/AuthDemoPlansSection";
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AuthDemoLanding = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <AuthDemoBreadcrumbs currentPage="landing" />
    {/* HERO & DEMO */}
    <AuthDemoHero />
    {/* FEATURE BREAKDOWN */}
    <AuthDemoFeatureBreakdown />
    {/* PLANS */}
    <AuthDemoPlansSection />
    {/* Optionally, link to features page */}
    <div className="text-center my-8">
      <Button asChild variant="outline" size="lg">
        <Link to="/auth-demo/features">See All Feature Details</Link>
      </Button>
    </div>
  </div>
);

export default AuthDemoLanding;
