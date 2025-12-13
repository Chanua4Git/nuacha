interface SolutionBridgeProps {
  headline: string;
  subheadline: string;
  features?: string[];
}

export const SolutionBridge = ({
  headline,
  subheadline,
  features = [],
}: SolutionBridgeProps) => {
  return (
    <section id="solution" className="py-16 sm:py-24 px-4 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-soft-green/30 text-primary text-sm font-medium mb-6">
          Meet Nuacha
        </div>
        
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground mb-6 leading-tight">
          {headline}
        </h2>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {subheadline}
        </p>
        
        {features.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {features.map((feature, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full bg-accent/50 text-foreground/80 text-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
