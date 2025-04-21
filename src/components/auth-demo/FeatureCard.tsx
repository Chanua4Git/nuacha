
import { Card, CardContent } from "@/components/ui/card";
import { Check, Shield, Users } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const FeatureCard = ({ title, description, icon }: FeatureCardProps) => (
  <Card className="hover:shadow-md transition-shadow border border-primary/20">
    <CardContent className="p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-lg font-playfair">{title}</h3>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);
