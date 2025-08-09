
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import { PlanCard } from "@/components/auth-demo/PlanCard";
import { Shield, Users } from "lucide-react";

const plans = [
  {
    title: "Nuacha Auth SaaS",
    subtitle:
      "Immediate access to self-service authentication for your app. Simple integration, no headaches.",
    features: [
      "Unlimited login/signup flows",
      "Email/password + social authentication",
      "User dashboard & admin tools",
    ],
    cta: "Start Your Free Auth Trial",
    ctaLink: "/authentication-demo#auth-demo-steps",
    icon: <Shield className="h-8 w-8 text-[#5A7684]" />,
    variant: "primary" as const,
  },
  {
    title: "Nuacha Auth Done-For-You",
    subtitle:
      "We set up authentication & security tailored for you. Technical onboarding included.",
    features: [
      "Personalized onboarding & integration",
      "Custom roles & permission logic",
      "Priority privacy & compliance support",
    ],
    cta: "Request a Consultation",
    ctaLink: "/contact",
    icon: <Users className="h-8 w-8 text-[#5A7684]" />,
    variant: "secondary" as const,
  },
];

const AuthDemoPlans = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <AuthDemoBreadcrumbs currentPage="plans" />
    <div className="max-w-4xl mx-auto space-y-12 text-center">
      <div className="space-y-6">
        <h1 className="text-3xl md:text-4xl font-playfair">
          Choose Your Auth Solution
        </h1>
        <p className="text-muted-foreground">
          SaaS for instant integration, or Done-For-You for expert support.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <PlanCard key={plan.title} {...plan} />
        ))}
      </div>
    </div>
  </div>
);

export default AuthDemoPlans;
