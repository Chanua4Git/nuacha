import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ShowcaseItem {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

interface ProductShowcaseProps {
  items: ShowcaseItem[];
}

export const ProductShowcase = ({ items }: ProductShowcaseProps) => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-foreground mb-4">
          Everything you need, nothing you don't
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Simple, focused tools that work the way you think.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="p-6 sm:p-8 bg-card border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {item.title}
                      </h3>
                      {item.badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
