import { Card } from "@/components/ui/card";

interface AgitationCardProps {
  emoji: string;
  title: string;
  description: string;
}

export const AgitationCard = ({ emoji, title, description }: AgitationCardProps) => {
  return (
    <Card className="p-6 bg-card/50 border-border/50 hover:border-primary/20 transition-all hover:shadow-md">
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  );
};
