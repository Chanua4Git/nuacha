import { AgitationCard } from "./AgitationCard";

interface AgitationItem {
  emoji: string;
  title: string;
  description: string;
}

interface AgitationSectionProps {
  headline?: string;
  items: AgitationItem[];
}

export const AgitationSection = ({
  headline = "Sound familiar?",
  items,
}: AgitationSectionProps) => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-foreground mb-4">
          {headline}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          If any of these hit close to home, you're not alone.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <AgitationCard key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};
