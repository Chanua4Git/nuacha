
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Star } from "lucide-react";

type Plan = {
  title: string;
  subtitle: string;
  features: string[];
  cta: string;
  ctaLink: string;
  icon: React.ReactNode;
  variant?: "primary" | "secondary";
};

export const PlanCard = ({
  title,
  subtitle,
  features,
  cta,
  ctaLink,
  icon,
  variant = "primary",
}: Plan) => (
  <Card className={variant === "primary" ? "border-2 hover:border-primary/50 transition-colors" : "border-2 hover:border-accent/50"}>
    <CardContent className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        {icon}
        <h2 className="text-2xl font-playfair">{title}</h2>
      </div>
      <p className="text-muted-foreground">{subtitle}</p>
      <ul className="space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#5A7684]" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full" size="lg" asChild>
        <a href={ctaLink}>{cta}</a>
      </Button>
    </CardContent>
  </Card>
);
