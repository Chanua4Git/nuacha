
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Scan, Shield, Users2 } from "lucide-react";
import { Link } from "react-router-dom";

const Options = () => {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-playfair">
            Choose Your Receipt Scanning & Management Solution
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Select the approach that best fits your needs for managing expenses and receipts
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* SaaS Option */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-[#5A7684]" />
                <h2 className="text-2xl font-playfair">Nuacha SaaS Subscription</h2>
              </div>
              <p className="text-muted-foreground">
                Get instant access to all features, manage your accounts online, and enjoy automated tools. Perfect for those who want to be hands-on and enjoy the flexibility of a self-service solution.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-[#5A7684]" />
                  <span>Manage multiple family accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Scan className="h-5 w-5 text-[#5A7684]" />
                  <span>Unlimited receipt scanning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#5A7684]" />
                  <span>Cloud-based secure storage</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" asChild>
                <Link to="/signup">Start Your Free Trial</Link>
              </Button>
            </CardContent>
          </Card>

          {/* DFY Option */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <Users2 className="h-8 w-8 text-[#5A7684]" />
                <h2 className="text-2xl font-playfair">Nuacha Done-For-You Service</h2>
              </div>
              <p className="text-muted-foreground">
                Let our experts handle your expense tracking setup and management. We'll tailor Nuacha to your specific needs and provide ongoing support.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-[#5A7684]" />
                  <span>Personalized setup & training</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#5A7684]" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#5A7684]" />
                  <span>Custom workflows & integrations</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" size="lg" asChild>
                <Link to="/contact">Request a Consultation</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-playfair">Need Help Choosing?</h2>
          <p className="text-muted-foreground">
            Our team can provide personalized guidance and answer any questions you have about either solution.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Options;
