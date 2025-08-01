
import { UsersRound, BriefcaseBusiness, ListTodo, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const targetGroups = [
  {
    icon: UsersRound,
    title: "Multi-Family Managers",
    description: "Perfect for those managing finances across multiple households, whether caring for elderly parents or handling shared living arrangements."
  },
  {
    icon: Building2,
    title: "Small Business Owners",
    description: "Essential for Trinidad & Tobago businesses needing compliant payroll management with automated NIS calculations and employee record keeping."
  },
  {
    icon: BriefcaseBusiness,
    title: "Financial Administrators",
    description: "Ideal for professionals who work with multiple families and need organized, detailed financial tracking and reporting."
  },
  {
    icon: ListTodo,
    title: "Organized Individuals",
    description: "Great for anyone seeking a more structured and insightful way to track expenses, even for a single household."
  }
];

const WhoIsNuachaFor = () => {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-[#F4E8D3]/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair mb-4">
            Who is Nuacha For?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how Nuacha can bring clarity and peace to your financial management journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {targetGroups.map((group) => (
            <Card key={group.title} className="border-none shadow-sm bg-white/50 backdrop-blur transition-all duration-300 hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <group.icon className="w-12 h-12 text-[#5A7684] mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{group.title}</h3>
                  <p className="text-muted-foreground">{group.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoIsNuachaFor;
