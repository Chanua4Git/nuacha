import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PersonaCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  route: string;
  accentColor?: string;
  badge?: string;
}

export const PersonaCard = ({
  icon: Icon,
  title,
  subtitle,
  description,
  features,
  route,
  accentColor = "primary",
  badge,
}: PersonaCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 group bg-card">
      {badge && (
        <span className="absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
          {badge}
        </span>
      )}
      
      <div className="flex flex-col h-full">
        <div className={`w-14 h-14 rounded-2xl bg-${accentColor}/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-7 h-7 text-${accentColor}`} />
        </div>
        
        <h3 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
        
        <p className="text-foreground/80 mb-5 leading-relaxed">
          {description}
        </p>
        
        <ul className="space-y-2 mb-6 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        
        <Button 
          onClick={() => navigate(route)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          This is me →
        </Button>
      </div>
    </Card>
  );
};
