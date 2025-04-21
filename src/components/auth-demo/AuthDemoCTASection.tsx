
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AuthDemoCTASection = () => (
  <section className="text-center space-y-4 py-8 max-w-xl mx-auto">
    <h2 className="text-2xl font-playfair">Ready to Try Auth The Nuacha Way?</h2>
    <p className="text-muted-foreground text-lg max-w-prose mx-auto">
      Experience the full authentication system — sign up, sign in, reset a password, or explore admin tools.
    </p>
    <Button size="lg" asChild>
      <Link to="/auth-demo/plans">Explore Subscription Options</Link>
    </Button>
  </section>
);

export default AuthDemoCTASection;
