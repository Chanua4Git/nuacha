import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FeatureShowcaseItem } from '@/constants/featureShowcase';

interface FeatureShowcaseCardProps {
  feature: FeatureShowcaseItem;
}

export function FeatureShowcaseCard({ feature }: FeatureShowcaseCardProps) {
  const Icon = feature.icon;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-10 h-10 text-primary" />
            </div>
          </div>
          {feature.isLocalTT && (
            <Badge className="bg-[#C3DCD1] text-foreground hover:bg-[#C3DCD1]/90 shrink-0">
              🇹🇹 T&T Specific
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {feature.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Benefits for:</p>
          <div className="flex flex-wrap gap-1.5">
            {feature.benefitsFor.map((persona) => (
              <Badge key={persona} variant="secondary" className="text-xs">
                {persona}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full group">
          <Link to={feature.ctaPath}>
            {feature.ctaText}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
