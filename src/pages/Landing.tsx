
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Download, Scan, Shield, Users2 } from "lucide-react";
import { Link } from "react-router-dom";
const Landing = () => {
  return <div className="min-h-screen bg-background">
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
              <Link to="/demo">
                <Button size="lg" className="rounded-full px-8 bg-[#5A7684] hover:bg-[#5A7684]/90 transition-all duration-300">
                  Discover our receipt scanning solution
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
            {features.map(feature => <Card key={feature.title} className="border-none shadow-sm bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <feature.icon className="w-10 h-10 text-[#5A7684] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Try It Out Section */}
      

      {/* Call to Action Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-[#5A7684] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-playfair mb-6">
            Give Yourself the Gift of Financial Peace
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Start your journey to mindful financial management today.
          </p>
          <Link to="/demo">
            <Button size="lg" variant="secondary" className="rounded-full px-8 bg-white text-[#5A7684] hover:bg-white/90">
              Try a Quick Demo
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-playfair text-lg mb-4">About Nuacha</h3>
              <p className="text-sm text-muted-foreground">
                A softer way to track spending and manage family finances.
              </p>
            </div>
            <div>
              <h3 className="font-playfair text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-playfair text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-sm text-muted-foreground hover:text-foreground">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-playfair text-lg mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Twitter
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nuacha. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};

const features = [{
  title: "Cultivate Calm with Organized Finances",
  description: "Effortlessly manage each family's expenses in one serene space, maintaining clarity and peace of mind.",
  icon: Users2
}, {
  title: "Release the Stress of Manual Entry",
  description: "Gently capture and organize receipts with our intelligent scanning technology, freeing your time and mind.",
  icon: Scan
}, {
  title: "Nurture Future Security",
  description: "Rest easy knowing your financial information is secure and protected while planning for future needs.",
  icon: Shield
}];

export default Landing;
