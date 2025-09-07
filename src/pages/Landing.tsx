import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Scan, Users2, Calculator, FileSpreadsheet, TrendingUp, PieChart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import DemoBreadcrumbs from "@/components/DemoBreadcrumbs";
import WhoIsNuachaFor from "@/components/landing/WhoIsNuachaFor";
import HeroUploadSection from "@/components/HeroUploadSection";
import { useExitIntent } from "@/hooks/useExitIntent";
import { useTimeBasedLeadCapture } from "@/hooks/useTimeBasedLeadCapture";
import { useLeadCaptureManager } from "@/hooks/useLeadCaptureManager";
import ExitIntentLeadCaptureModal from "@/components/lead-capture/ExitIntentLeadCaptureModal";
import TimeBasedLeadCaptureBanner from "@/components/lead-capture/TimeBasedLeadCaptureBanner";
import { OCRResult } from "@/types/expense";
import { toast } from "sonner";
import { handleReceiptUpload } from "@/utils/receipt/uploadHandling";
import { processReceiptWithEdgeFunction } from "@/utils/receipt/ocrProcessing";
import { useIsMobile } from "@/hooks/use-mobile";

const Landing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Receipt processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  
  // Initialize the unified lead capture manager
  const {
    shouldEnableExitIntent,
    shouldEnableTimeBased,
    markCompleted,
    markDismissed,
    getStatusMessage
  } = useLeadCaptureManager();

  const { showExitIntent, resetExitIntent, disableExitIntent } = useExitIntent({
    threshold: 50,
    delay: 500,
    enabled: shouldEnableExitIntent
  });

  const { showBanner, closeBanner, disableBanner } = useTimeBasedLeadCapture({
    inactivityThreshold: 3 * 60 * 1000, // 3 minutes
    enabled: shouldEnableTimeBased
  });

  // Camera click handler
  const handleCameraClick = () => {
    if (fileInputRef.current) {
      if (isMobile) {
        // On mobile, set capture attribute and provide feedback
        fileInputRef.current.setAttribute('capture', 'environment');
        toast("Opening camera...", {
          description: "Take a photo of your receipt to get started!"
        });
      } else {
        // On desktop, explain what's happening
        fileInputRef.current.removeAttribute('capture');
        toast("Select a photo from your device", {
          description: "Choose a photo of your receipt from your computer or gallery."
        });
      }
      fileInputRef.current.click();
    }
  };

  // Upload click handler
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  // File processing handler
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    // Immediate feedback that system is working
    toast("System is working for you! 🚀", {
      description: "Hold on, we're processing your receipt and will redirect you to complete the magic."
    });
    
    setCurrentFile(file);
    setIsProcessing(true);
    
    try {
      toast("Processing your receipt...", {
        description: "We're extracting the details for you. This might take a moment."
      });

      // Upload the receipt
      const receiptUrl = await handleReceiptUpload(file);
      
      if (!receiptUrl) {
        throw new Error('Failed to upload receipt');
      }

      // Process with OCR
      const ocrResult = await processReceiptWithEdgeFunction(receiptUrl);
      
      if (ocrResult.error) {
        throw new Error(ocrResult.error);
      }

      // Navigate to demo with processed data
      navigate('/demo', {
        state: {
          extractedData: ocrResult,
          receiptUrl: receiptUrl,
          preProcessed: true
        }
      });

      toast.success("Receipt processed successfully!", {
        description: "Redirecting you to complete your expense entry."
      });

    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error("Couldn't process your receipt", {
        description: "Let's try that again, or you can enter details manually.",
        action: {
          label: "Try Demo",
          onClick: () => navigate('/demo')
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return <>
      <DemoBreadcrumbs currentPage="home" />
      <div className="min-h-screen bg-background py-12 px-4">
        {/* Hero Upload Section */}
        <section className="relative">
          <HeroUploadSection 
            onCameraClick={handleCameraClick}
            onUploadClick={handleUploadClick}
            onFileSelect={handleFileSelect}
            isDemo={true}
          />
          {/* Hidden file input for camera/upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
        </section>

        {/* Budget CTA Section */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-[#F4E8D3]/30 via-[#C3DCD1]/20 to-[#F1CBC7]/30 rounded-3xl p-8 md:p-12 backdrop-blur border border-white/20">
              <PieChart className="w-16 h-16 text-[#5A7684] mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-playfair mb-4 text-foreground">
                Want to plan your budget too?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create your personalized budget with our 50/30/20 builder. Perfect for families and stay-at-home parents planning their finances.
              </p>
              <Link to="/demo/budget">
                <Button size="lg" className="bg-[#5A7684] hover:bg-[#5A7684]/90 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
                  Create Your Budget Plan
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative py-20 px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair tracking-tight">
                Complete Financial Management for Families & Businesses
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                From household expense tracking to Trinidad & Tobago payroll compliance — find peace in comprehensive financial management.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/demo">
                  <Button size="lg" className="rounded-full px-8 bg-[#5A7684] hover:bg-[#5A7684]/90 transition-all duration-300">
                    Try Expense Tracking
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/demo/budget">
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-[#5A7684] text-[#5A7684] hover:bg-[#5A7684] hover:text-white transition-all duration-300">
                    Build Your Budget
                    <PieChart className="ml-2" />
                  </Button>
                </Link>
                <Link to="/payroll">
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-[#5A7684] text-[#5A7684] hover:bg-[#5A7684] hover:text-white transition-all duration-300">
                    Explore Payroll System
                    <Calculator className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Who is Nuacha For Section */}
        <WhoIsNuachaFor />

        {/* Problem/Solution Section */}
        <section className="py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-transparent to-[#F4E8D3]/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair mb-4">
                Comprehensive Financial Solutions for Every Need
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether managing family expenses or running a business in Trinidad & Tobago, discover tools that bring peace and clarity to your financial world.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map(feature => <Card key={feature.title} className="border-none shadow-sm bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <feature.icon className="w-10 h-10 text-[#5A7684] mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Demo Sections */}
        <section className="py-16 px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-playfair mb-4">
                Experience Nuacha in Action
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Try our interactive demos to see how Nuacha can transform your financial management.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-none shadow-lg bg-gradient-to-br from-[#F4E8D3]/20 to-white backdrop-blur">
                <CardContent className="p-8">
                  <Scan className="w-12 h-12 text-[#5A7684] mb-4" />
                  <h3 className="text-2xl font-playfair mb-4">Expense Management Demo</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload receipts and see how our intelligent scanning captures your expenses automatically. Perfect for families and multi-household management.
                  </p>
                  <Link to="/demo">
                    <Button className="w-full bg-[#5A7684] hover:bg-[#5A7684]/90">
                      Try Receipt Scanning
                      <ArrowRight className="ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-gradient-to-br from-[#E8F2F0]/20 to-white backdrop-blur">
                <CardContent className="p-8">
                  <PieChart className="w-12 h-12 text-[#5A7684] mb-4" />
                  <h3 className="text-2xl font-playfair mb-4">Personal Budget Builder</h3>
                  <p className="text-muted-foreground mb-6">
                    Create personalized budgets with the 50/30/20 rule. Perfect for families and SAHM (Stay-at-Home Moms) financial planning.
                  </p>
                  <Link to="/demo/budget">
                    <Button variant="outline" className="w-full border-[#5A7684] text-[#5A7684] hover:bg-[#5A7684] hover:text-white">
                      Build Your Budget
                      <PieChart className="ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-gradient-to-br from-[#C3DCD1]/20 to-white backdrop-blur">
                <CardContent className="p-8">
                  <Calculator className="w-12 h-12 text-[#5A7684] mb-4" />
                  <h3 className="text-2xl font-playfair mb-4">Trinidad & Tobago Payroll</h3>
                  <p className="text-muted-foreground mb-6">
                    Calculate compliant payroll with automated NIS contributions. Designed specifically for Trinidad & Tobago businesses of all sizes.
                  </p>
                  <Link to="/payroll">
                    <Button variant="outline" className="w-full border-[#5A7684] text-[#5A7684] hover:bg-[#5A7684] hover:text-white">
                      Explore Payroll System
                      <Calculator className="ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* Footer */}
        <footer className="py-12 px-4 md:px-6 lg:px-8 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-playfair text-lg mb-4">About Nuacha</h3>
                <p className="text-sm text-muted-foreground">
                  Complete financial management for families and Trinidad & Tobago businesses.
                </p>
              </div>
              <div>
                <h3 className="font-playfair text-lg mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-playfair text-lg mb-4">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/help" className="text-sm text-muted-foreground hover:text-foreground">
                      Help Center
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-playfair text-lg mb-4">Connect</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Twitter
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Nuacha. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Exit Intent Lead Capture Modal */}
        <ExitIntentLeadCaptureModal 
          open={showExitIntent} 
          onOpenChange={(open) => {
            if (!open) {
              disableExitIntent();
            }
          }}
          onCompleted={() => markCompleted('exit-intent')}
          onDismissed={() => markDismissed('exit-intent')}
        />

        {/* Time-Based Lead Capture Banner */}
        <TimeBasedLeadCaptureBanner 
          open={showBanner} 
          onClose={disableBanner}
          onCompleted={() => markCompleted('time-based')}
          onDismissed={() => markDismissed('time-based')}
        />
      </div>
    </>;
};
const features = [{
  title: "Multi-Family Expense Management",
  description: "Effortlessly track expenses across multiple households with intelligent receipt scanning and organized categorization.",
  icon: Users2
}, {
  title: "Smart Receipt Processing",
  description: "Upload receipts and let our AI extract expense details automatically, saving time and reducing manual entry errors.",
  icon: Scan
}, {
  title: "Trinidad & Tobago Payroll Compliance",
  description: "Calculate accurate payroll with automated NIS contributions, ensuring your business stays compliant with local regulations.",
  icon: Calculator
}, {
  title: "Comprehensive Reporting",
  description: "Generate detailed financial reports for expense analysis and payroll summaries to support informed decision-making.",
  icon: FileSpreadsheet
}, {
  title: "Business Growth Insights",
  description: "Track spending patterns and payroll trends to identify opportunities for optimization and growth.",
  icon: TrendingUp
}, {
  title: "Enterprise-Grade Security",
  description: "Your financial data is protected with bank-level security, ensuring privacy and peace of mind for families and businesses.",
  icon: Shield
}];
export default Landing;