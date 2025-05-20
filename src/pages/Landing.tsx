
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Scan, Users2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/contexts/AuthProvider";

const Landing = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center py-12 md:py-24 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-playfair tracking-tight mb-4">
            A softer way to track spending
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Calm, mindful financial tracking designed for families and caregivers.
          </p>
          
          {user ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg mb-2">
                <p className="text-primary font-medium">You're signed in</p>
                <p className="text-sm text-muted-foreground">Continue to the app to manage your finances</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="px-8">
                  <Link to="/app">
                    Add Expense
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/dashboard">
                    View Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="px-8">
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Feature Cards */}
        <section className="py-12 grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mindful Tracking</h3>
              <p className="text-muted-foreground">
                Gently track your expenses with a calm, judgment-free approach designed for mental wellbeing.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Scan className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Receipt Scanning</h3>
              <p className="text-muted-foreground">
                Easily capture receipts and let Nuacha extract the details, saving you time and reducing stress.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Users2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Family Support</h3>
              <p className="text-muted-foreground">
                Manage expenses for multiple households or family groups, perfect for caregivers and extended families.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Landing;
