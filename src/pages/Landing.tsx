
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Scan, Shield, Users2 } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair tracking-tight">
              Find Peace in Your Finances with Nuacha
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Effortlessly manage expenses for all your families, gaining clarity and control that nurtures your well-being.
            </p>
            <div className="pt-4">
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-8">
                  Embrace Financial Peace
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-transparent to-[#F4E8D3]/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair mb-4">
              Feeling Overwhelmed? Find Calm in Clarity
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transform the stress of managing multiple family finances into a peaceful journey of organization and clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-sm bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <feature.icon className="w-10 h-10 text-[#5A7684] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-[#5A7684] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-playfair mb-6">
            Give Yourself the Gift of Financial Peace
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Start your journey to mindful financial management today.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-8 bg-white text-[#5A7684] hover:bg-white/90"
            >
              Begin Your Gentle Path to Clarity
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    title: "Multi-Family Management",
    description: "Organize expenses for multiple families in one serene space, maintaining clarity and peace of mind.",
    icon: Users2,
  },
  {
    title: "Gentle Receipt Capture",
    description: "Effortlessly capture and organize receipts with our intelligent scanning technology.",
    icon: Scan,
  },
  {
    title: "Private & Protected",
    description: "Rest easy knowing your financial information is secure and protected.",
    icon: Shield,
  },
];

export default Landing;
