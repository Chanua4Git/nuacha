import { PersonaCard } from "@/components/sales/PersonaCard";
import { Home, Building2, Briefcase } from "lucide-react";

const GetStarted = () => {
  const personas = [
    {
      icon: Home,
      title: "Family & Caregivers",
      subtitle: "For SAHMs, caregivers, and multi-family managers",
      description: "Track expenses for multiple families, manage budgets, and finally know where the money goes each month.",
      features: [
        "Multi-family expense tracking",
        "Per-member expense assignment",
        "Budget builder (50/30/20 rule)",
        "Smart receipt scanning",
      ],
      route: "/get-started/families",
      badge: "Most Popular",
    },
    {
      icon: Building2,
      title: "Small Business",
      subtitle: "For T&T businesses managing payroll",
      description: "Calculate NIS contributions, track employee wages, and keep your business expenses organized.",
      features: [
        "🇹🇹 NIS payroll calculator",
        "Shift-based wage tracking",
        "Quick pay entry",
        "Business expense reports",
      ],
      route: "/get-started/business",
      badge: "T&T Focused",
    },
    {
      icon: Briefcase,
      title: "Solo Entrepreneurs",
      subtitle: "For those wearing every hat",
      description: "You run a business AND manage a household. Get tools for both worlds in one place.",
      features: [
        "All family features included",
        "All business features included",
        "Personal + business separation",
        "Complete financial picture",
      ],
      route: "/get-started/entrepreneurs",
      badge: "Best Value",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-soft-green/30 text-primary text-sm font-medium mb-6">
            A softer way to track spending
          </div>
          
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-6">
            Which best describes you?
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us a bit about your situation, and we'll show you exactly how Nuacha can help.
          </p>
        </div>
      </section>
      
      {/* Persona Cards */}
      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {personas.map((persona, index) => (
              <PersonaCard key={index} {...persona} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Trust Footer */}
      <section className="py-12 px-4 bg-muted/30 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Trusted by families and businesses across Trinidad & Tobago
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground/80">
            <span>🔒 Bank-level security</span>
            <span>📱 Works on any device</span>
            <span>🇹🇹 Built for T&T</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GetStarted;
