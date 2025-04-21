
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, User, Key } from "lucide-react";

const AuthDemoHero = () => (
  <section className="py-20 px-4 md:px-6 lg:px-8 bg-background">
    <div className="max-w-6xl mx-auto space-y-8 text-center">
      {/* Hero Copy */}
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-playfair tracking-tight">
          Try Our Supabase Authentication Module
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience how Nuacha makes user management effortless with secure, production-ready login, signup, and password reset flows — all powered by Supabase.
        </p>
        <p className="text-md text-[#5A7684] font-medium">
          This interactive demo showcases Nuacha’s complete authentication system. From email verification to password recovery, you’ll see exactly how our reusable login module can be integrated into your app or sold as a SaaS-ready product.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs font-medium text-muted-foreground mt-2">
          <span className="px-2 py-1 rounded-full bg-soft-green/40">🔒 Secure by default</span>
          <span className="px-2 py-1 rounded-full bg-accent/30">⚙️ Fully configurable</span>
          <span className="px-2 py-1 rounded-full bg-blush/30">💡 Built with devs & end-users in mind</span>
        </div>
        <p className="text-sm text-muted-foreground mt-6 italic">
          ⚠️ This demo uses test credentials and sandboxed data. No real user accounts are created.
        </p>
      </div>
      {/* Demo Box & Info Banner */}
      <div className="mx-auto max-w-lg w-full">
        {/* Info Banner */}
        <div className="mb-3 rounded-lg bg-accent/60 border border-accent/40 py-3 px-4 flex items-center gap-3 text-left text-muted-foreground text-sm">
          <AlertCircle className="h-5 w-5 text-[#5A7684]" />
          <div>
            <span className="font-medium">🔍 This demo is a preview of Nuacha’s authentication solution.</span>
            <br />No data is stored. All sessions are temporary and reset after logout or refresh.
          </div>
        </div>
        {/* Demo Interaction Box */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-gray-200">
          <h2 className="text-2xl font-playfair mb-2">Start the Demo</h2>
          <p className="mb-4 text-muted-foreground text-base">
            Try the flows live — sign up, log in, and reset your password using our modular system.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button asChild className="flex-1" size="lg" variant="outline">
              <Link to="/signup">
                <User className="w-4 h-4 mr-2" />
                Try Sign Up
              </Link>
            </Button>
            <Button asChild className="flex-1" size="lg" variant="outline">
              <Link to="/login">
                <Key className="w-4 h-4 mr-2" />
                Try Login
              </Link>
            </Button>
            <Button asChild className="flex-1" size="lg" variant="outline">
              <Link to="/reset-password">
                <Key className="w-4 h-4 mr-2" />
                Try Password Reset
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            All flows work with real-time Supabase session handling, token refresh, and route protection.
          </p>
          <Button asChild variant="link" className="mt-2 text-primary">
            <Link to="/auth-demo/features">Or dive deeper → Explore Auth Product Features</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default AuthDemoHero;
