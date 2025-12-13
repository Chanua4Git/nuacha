import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ValueItem {
  feature: string;
  value: string;
}

interface ValueStackPricingProps {
  items: ValueItem[];
  totalValue: string;
  actualPrice: string;
  pricePeriod?: string;
  ctaText?: string;
  ctaRoute?: string;
  badge?: string;
}

export const ValueStackPricing = ({
  items,
  totalValue,
  actualPrice,
  pricePeriod = "/month",
  ctaText = "Start Your Free Trial",
  ctaRoute = "/signup",
  badge = "Early Adopter Pricing",
}: ValueStackPricingProps) => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 px-4 bg-background">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-foreground mb-4">
          What you get
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Everything included. No hidden fees. Cancel anytime.
        </p>
        
        <Card className="p-6 sm:p-8 bg-card border-2 border-primary/20">
          {badge && (
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {badge}
              </span>
            </div>
          )}
          
          <div className="space-y-4 mb-8">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{item.feature}</span>
                </div>
                <span className="text-muted-foreground text-sm line-through">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t-2 border-dashed border-border pt-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Total Value:</span>
              <span className="text-lg line-through text-muted-foreground">{totalValue}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-foreground">Your Price:</span>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-bold text-primary">{actualPrice}</span>
                <span className="text-muted-foreground">{pricePeriod}</span>
              </div>
            </div>
          </div>
          
          <Button
            size="lg"
            onClick={() => navigate(ctaRoute)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-xl"
          >
            {ctaText}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            💚 No credit card required to start
          </p>
        </Card>
      </div>
    </section>
  );
};
