
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users } from "lucide-react";

const AuthDemoPlansSection = () => (
  <section className="py-20 px-4 md:px-6 lg:px-8 bg-[#5A7684] text-white">
    <div className="max-w-6xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-playfair mb-6">
        Choose the Right Option for You
      </h2>
      <p className="text-lg mb-10 text-white/90">
        Select the solution that fits your project goals — whether you want to integrate it yourself or get expert setup.
      </p>
      <div className="grid md:grid-cols-2 gap-8 text-left">
        {/* SaaS Module */}
        <div className="bg-white/90 rounded-xl shadow border border-soft-green/50 p-8 flex flex-col gap-5 text-[#2F2F2F]">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-8 w-8 text-[#5A7684]" />
            <span className="text-2xl font-playfair">Nuacha Auth SaaS Module</span>
          </div>
          <ul className="space-y-2 text-base">
            <li>• Prebuilt authentication UI</li>
            <li>• Clean form validation and routing</li>
            <li>• Easy-to-configure redirect logic</li>
            <li>• <span className="italic">Role-based access coming soon</span></li>
            <li>• Plug-and-play with your Supabase project</li>
          </ul>
          <Button asChild className="w-full mt-2" size="lg" variant="outline">
            <Link to="/login">Start Free Trial →</Link>
          </Button>
        </div>
        {/* DFY Option */}
        <div className="bg-white/90 rounded-xl shadow border border-blush/50 p-8 flex flex-col gap-5 text-[#2F2F2F]">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-8 w-8 text-[#5A7684]" />
            <span className="text-2xl font-playfair">Nuacha Done-For-You Auth Setup</span>
          </div>
          <ul className="space-y-2 text-base">
            <li>• Personalized setup & theming</li>
            <li>• Connect to your database or CMS</li>
            <li>• Role and subscription gating</li>
            <li>• Optional team access & onboarding</li>
            <li>• Maintenance & enhancement support</li>
          </ul>
          <Button asChild className="w-full mt-2" size="lg" variant="secondary">
            <Link to="/contact">Request Consultation →</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default AuthDemoPlansSection;
