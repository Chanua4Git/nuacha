
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import AuthDemoCTASection from "@/components/auth-demo/AuthDemoCTASection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AuthDemoLanding = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <AuthDemoBreadcrumbs currentPage="landing" />
    <div className="max-w-4xl mx-auto space-y-12 text-center">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-playfair">
          Try Our Nuacha Auth Demo
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how easy it is to integrate and customize authentication in a modern app.
        </p>
      </div>
      <div>
        <img src="/placeholder.svg" alt="Auth Demo Illustration" className="mx-auto rounded-lg shadow-md max-h-72 object-contain bg-accent" />
      </div>
      <AuthDemoCTASection />
      <div className="flex flex-col gap-4 items-center pt-2">
        <Button variant="outline" asChild>
          <Link to="/auth-demo/features">View All Features</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default AuthDemoLanding;
