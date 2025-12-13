import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FinalCTAProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaRoute?: string;
  benefits?: string[];
}

export const FinalCTA = ({
  headline = "Ready to find your financial peace?",
  subheadline = "Join hundreds of families and businesses already using Nuacha.",
  ctaText = "Get Started Free",
  ctaRoute = "/signup",
  benefits = [
    "No credit card required",
    "Cancel anytime, no hard feelings",
    "Your data stays yours",
  ],
}: FinalCTAProps) => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-muted/30 to-accent/20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground mb-4">
          {headline}
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8">
          {subheadline}
        </p>
        
        <Button
          size="lg"
          onClick={() => navigate(ctaRoute)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all mb-8"
        >
          {ctaText}
        </Button>
        
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {benefits.map((benefit, index) => (
            <span key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">💚</span>
              {benefit}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
