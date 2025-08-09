import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthDemoSteps } from "@/components/landing/AuthDemoSteps";
import AuthDemoHero from "@/components/auth-demo/AuthDemoHero";
import AuthDemoFeatureBreakdown from "@/components/auth-demo/AuthDemoFeatureBreakdown";
import AuthDemoPlansSection from "@/components/auth-demo/AuthDemoPlansSection";
import AuthDemoCTASection from "@/components/auth-demo/AuthDemoCTASection";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { useAuthDemo } from "@/auth/contexts/AuthDemoProvider";
import { AuthDemoStep } from "@/auth/services/AuthDemoService";
import { Button } from "@/components/ui/button";

const AuthenticationDemo = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { demoStep, setDemoStep, resetDemo } = useAuthDemo();

  useEffect(() => {
    document.title = "Authentication Demo | Nuacha";
    // Canonical tag
    const link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", `${window.location.origin}/authentication-demo`);
    document.head.appendChild(link);

    // Meta description for SEO
    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute(
      "content",
      "Authentication Demo by Nuacha – Try secure, user-friendly signup, login, and password reset flows, powered by Supabase."
    );
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(meta);
    };
  }, []);

  // Ensure first-time visitors start at Step 1 (Sign Up)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isVerified = params.get("verified") === "true";
    const isFromDemo = params.get("from") === "auth-demo";

    if (!user && !isVerified && !isFromDemo && demoStep !== AuthDemoStep.Initial) {
      setDemoStep(AuthDemoStep.Initial);
    }
  }, [location.search, user, demoStep, setDemoStep]);

  return (
    <main>
      {/* Hero / Intro */}
      <AuthDemoHero />

      {/* Who is this for? */}
      <section className="py-10 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-playfair mb-4 text-center">
            Who is this Authentication System for?
          </h2>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto">
            A gentle, production-ready auth foundation for makers, small teams, and growing products. If you want secure, dependable sign up, login, and password reset without the stress — this is for you.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <article className="rounded-xl border bg-background p-6 shadow-sm">
              <h3 className="font-medium mb-2">Product builders & startups</h3>
              <p className="text-muted-foreground text-sm">Ship auth in hours, not weeks — with clean UI and clear flows.</p>
            </article>
            <article className="rounded-xl border bg-background p-6 shadow-sm">
              <h3 className="font-medium mb-2">Internal tools & dashboards</h3>
              <p className="text-muted-foreground text-sm">Protect admin areas and manage users confidently.</p>
            </article>
            <article className="rounded-xl border bg-background p-6 shadow-sm">
              <h3 className="font-medium mb-2">Agencies & freelancers</h3>
              <p className="text-muted-foreground text-sm">Reuse a solid auth core across client projects with ease.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Controls above steps */}
      <section className="px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h2 className="sr-only">Experience it in Action</h2>
          <p className="text-sm text-muted-foreground">Follow the steps below to experience the full flow.</p>
          <Button variant="outline" onClick={resetDemo}>Start over</Button>
        </div>
      </section>

      {/* Interactive steps */}
      <AuthDemoSteps />

      {/* Features and plans */}
      <AuthDemoFeatureBreakdown />
      <AuthDemoPlansSection />
      <AuthDemoCTASection />
    </main>
  );
};

export default AuthenticationDemo;
