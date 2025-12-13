import { Button } from "@/components/ui/button";

interface PainPointHeroProps {
  headline: string;
  subheadline: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export const PainPointHero = ({
  headline,
  subheadline,
  ctaText = "Show me how",
  onCtaClick,
}: PainPointHeroProps) => {
  const scrollToSolution = () => {
    document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center px-4 py-16 sm:py-24 overflow-hidden">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-soft-green/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight mb-6">
          {headline}
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {subheadline}
        </p>
        
        <Button
          size="lg"
          onClick={onCtaClick || scrollToSolution}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
        >
          {ctaText}
        </Button>
      </div>
    </section>
  );
};
