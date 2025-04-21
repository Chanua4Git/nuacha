
import { Check, Key, User } from "lucide-react";

const features = [
  {
    title: "Email/Password Auth",
    description: "Fully functional signup, login, and password reset with validation",
    icon: <Key className="w-6 h-6 text-[#5A7684]" />,
  },
  {
    title: "Secure Sessions",
    description: "Session persistence and token auto-refresh with Supabase",
    icon: <Check className="w-6 h-6 text-[#5A7684]" />,
  },
  {
    title: "Auth Context",
    description: "Centralized auth state with onAuthStateChange listener",
    icon: <User className="w-6 h-6 text-[#5A7684]" />,
  },
  {
    title: "Protected Routes",
    description: "Block unauthenticated access and redirect cleanly",
    icon: <Check className="w-6 h-6 text-[#5A7684]" />,
  },
  {
    title: "Configurable UI",
    description: "Customize form copy, validation rules, themes",
    icon: <Check className="w-6 h-6 text-[#5A7684]" />,
  },
  {
    title: "Packaging Ready",
    description: "Modular file structure for reuse, SaaS or DFY deployment",
    icon: <Check className="w-6 h-6 text-[#5A7684]" />,
  },
];

const AuthDemoFeatureBreakdown = () => (
  <section id="auth-demo-features" className="py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-transparent to-[#F4E8D3]/20">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-playfair mb-4">
          What’s Included in This Auth Module
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A fully integrated and extensible authentication solution, ready to drop into your app or sell as a product.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg bg-white/70 shadow-sm border border-gray-200 p-7 flex flex-col gap-3 items-start hover:shadow-md duration-100">
            <div className="flex items-center gap-2">{f.icon}
              <span className="text-lg font-semibold font-playfair">{f.title}</span>
            </div>
            <p className="text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AuthDemoFeatureBreakdown;
