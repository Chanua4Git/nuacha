import { Card } from "@/components/ui/card";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  headline?: string;
}

export const TestimonialsSection = ({
  testimonials,
  headline = "Loved by families and businesses",
}: TestimonialsSectionProps) => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-foreground mb-12">
          {headline}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 bg-card border-border/50">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              
              <blockquote className="text-foreground/80 mb-6 leading-relaxed italic">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {testimonial.avatar || testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
