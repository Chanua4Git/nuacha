
import AuthDemoBreadcrumbs from "@/components/auth-demo/AuthDemoBreadcrumbs";
import { FeatureCard } from "@/components/auth-demo/FeatureCard";
import { Lock, Users, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Flexible Login & Signup",
    description:
      "Support for email/password, social logins, and passwordless flows. Easy to enable or disable any method.",
    icon: <Lock className="h-6 w-6 text-primary" />,
  },
  {
    title: "User Management",
    description:
      "Admin dashboard, user roles, and permission systems included. RBAC ready.",
    icon: <Users className="h-6 w-6 text-primary" />,
  },
  {
    title: "Secure Sessions",
    description:
      "Automatic session handling and persistent auth, fully secure and GDPR-compliant.",
    icon: <Shield className="h-6 w-6 text-primary" />,
  },
  {
    title: "Friendly Email Flows",
    description:
      "Password resets and email verification, all styled to match your brand.",
    icon: <Mail className="h-6 w-6 text-primary" />,
  },
];

const AuthDemoFeatures = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <AuthDemoBreadcrumbs currentPage="features" />
    <div className="max-w-4xl mx-auto space-y-12 text-center">
      <div className="space-y-6">
        <h1 className="text-3xl md:text-4xl font-playfair">
          Everything You Need to Launch Secure Auth
        </h1>
        <p className="text-lg text-muted-foreground">
          See what's possible with Nuacha Auth — for developers, managers, and users.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 mt-10">
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
      <div className="mt-12">
        <Button size="lg" asChild>
          <Link to="/auth-demo">Back to Auth Demo Home</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default AuthDemoFeatures;
