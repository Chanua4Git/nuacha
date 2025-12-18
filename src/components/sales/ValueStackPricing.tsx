import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, HardDrive } from "lucide-react";
import { SubscriptionPurchaseModal } from "@/components/payment/SubscriptionPurchaseModal";
import { PlanType } from "@/constants/nuachaPayment";

interface ValueItem {
  feature: string;
  value: string;
}

interface ValueStackPricingProps {
  items: ValueItem[];
  totalValue: string;
  actualPriceTTD: string;
  actualPriceUSD?: string;
  storageTier?: string;
  pricePeriod?: string;
  ctaText?: string;
  planType?: PlanType;
  badge?: string;
  // Legacy props for backward compatibility
  actualPrice?: string;
}

export const ValueStackPricing = ({
  items,
  totalValue,
  actualPriceTTD,
  actualPriceUSD,
  storageTier,
  pricePeriod = "/month",
  ctaText = "Start Now",
  planType = "staying_organized",
  badge = "Most Popular",
  // Legacy support
  actualPrice,
}: ValueStackPricingProps) => {
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  // Support legacy actualPrice prop
  const displayPriceTTD = actualPriceTTD || actualPrice || "TT$149";

  return (
    <>
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

            {/* Storage highlight */}
            {storageTier && (
              <div className="flex items-center justify-center gap-2 mb-6 pb-4 border-b border-border">
                <HardDrive className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{storageTier}</span>
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
                  <span className="text-3xl sm:text-4xl font-bold text-primary">{displayPriceTTD}</span>
                  <span className="text-muted-foreground">{pricePeriod}</span>
                  {actualPriceUSD && (
                    <div className="text-sm text-muted-foreground">
                      ({actualPriceUSD})
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              size="lg"
              onClick={() => setPurchaseModalOpen(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-xl"
            >
              {ctaText}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              💚 Bank transfer payment • WhatsApp support
            </p>
          </Card>
        </div>
      </section>

      <SubscriptionPurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        planType={planType}
      />
    </>
  );
};
