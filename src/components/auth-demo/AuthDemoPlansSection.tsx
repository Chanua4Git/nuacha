
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download, Palette, Users } from "lucide-react";
import { useState } from "react";
import DownloadPurchaseModal from "./DownloadPurchaseModal";

const AuthDemoPlansSection = () => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handleDownloadClick = () => {
    setShowPurchaseModal(true);
  };

  return (
  <section id="auth-demo-plans" className="py-20 px-4 md:px-6 lg:px-8 bg-[#5A7684] text-white">
    <div className="max-w-6xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-playfair mb-6">
        Choose the Right Option for You
      </h2>
      <p className="text-lg mb-10 text-white/90">
        Select the solution that fits your project goals — whether you want to integrate it yourself or get expert setup.
      </p>
      <div className="grid md:grid-cols-3 gap-8 text-left">
        {/* SaaS Solution */}
        <div className="bg-white/90 rounded-xl shadow border border-soft-green/50 p-8 flex flex-col gap-5 text-[#2F2F2F]">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-8 w-8 text-[#5A7684]" />
            <span className="text-2xl font-playfair">SaaS Solution</span>
          </div>
          <ul className="space-y-2 text-base">
            <li>• Hosted, managed, always up to date</li>
            <li>• Prebuilt authentication UI</li>
            <li>• Clean form validation and routing</li>
            <li>• Easy-to-configure redirect logic</li>
            <li>• Plug-and-play with your Supabase project</li>
          </ul>
          <Button asChild className="w-full mt-2" size="lg" variant="outline">
            <a href="#auth-demo-steps">Start Free Trial →</a>
          </Button>
        </div>

        {/* Download & Self-Host */}
        <div className="bg-white/90 rounded-xl shadow border border-soft-green/50 p-8 flex flex-col gap-5 text-[#2F2F2F]">
          <div className="flex items-center gap-3 mb-3">
            <Download className="h-8 w-8 text-[#5A7684]" />
            <span className="text-2xl font-playfair">Download & Self-Host</span>
          </div>
          <ul className="space-y-2 text-base">
            <li>• Full source code with advanced features</li>
            <li>• Deploy to your own infrastructure</li>
            <li>• Extend and customize as you grow</li>
          </ul>
          <Button className="w-full mt-2" size="lg" onClick={handleDownloadClick}>
            Purchase
          </Button>
        </div>

        {/* White Label Service */}
        <div className="bg-white/90 rounded-xl shadow border border-blush/50 p-8 flex flex-col gap-5 text-[#2F2F2F]">
          <div className="flex items-center gap-3 mb-3">
            <Palette className="h-8 w-8 text-[#5A7684]" />
            <span className="text-2xl font-playfair">White Label Service</span>
          </div>
          <ul className="space-y-2 text-base">
            <li>• Custom-built workflows</li>
            <li>• Advanced integrations</li>
            <li>• Industry-specific features</li>
          </ul>
          <Button asChild className="w-full mt-2" size="lg" variant="secondary">
            <Link to="/contact">Request a Consultation →</Link>
          </Button>
        </div>
      </div>
    </div>
    
    <DownloadPurchaseModal 
      open={showPurchaseModal} 
      onOpenChange={setShowPurchaseModal} 
    />
  </section>
  );
};

export default AuthDemoPlansSection;
