
import AuthDemoHero from "@/components/auth-demo/AuthDemoHero";
import AuthDemoFeatureBreakdown from "@/components/auth-demo/AuthDemoFeatureBreakdown";
import AuthDemoPlansSection from "@/components/auth-demo/AuthDemoPlansSection";
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import AuthDemoDemoCard from "@/components/auth-demo/AuthDemoDemoCard";

const AuthDemoLanding = () => (
  <div className="min-h-screen bg-background pb-12">
    <AuthDemoBreadcrumbs currentPage="landing" />
    <AuthDemoHero />
    <div className="max-w-6xl mx-auto w-full px-4 md:px-6 lg:px-8">
      <AuthDemoDemoCard />
    </div>
    <AuthDemoFeatureBreakdown />
    <AuthDemoPlansSection />
  </div>
);

export default AuthDemoLanding;
