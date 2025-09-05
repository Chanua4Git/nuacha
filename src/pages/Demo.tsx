
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Button as UIButton } from "@/components/ui/button";
import { useState } from "react";
import { OCRResult } from "@/types/expense";
import LeadCaptureForm from "@/components/demo/LeadCaptureForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ExpenseCard from "@/components/ExpenseCard";
import DemoBreadcrumbs from "@/components/DemoBreadcrumbs";
import DetailedReceiptView from "@/components/DetailedReceiptView";
import DemoExpenseForm from "@/components/demo/DemoExpenseForm";
import HeroUploadSection from "@/components/HeroUploadSection";

const Demo = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<OCRResult | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [demoExpense, setDemoExpense] = useState<any>(null);
  const navigate = useNavigate();

  const handleImageUpload = (file: File) => {
    setCurrentFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setDemoComplete(false);
    setShowLeadForm(false);
    setExtractedData(null);
    setCurrentFile(null);
    setDemoExpense(null);
  };

  const handleDataExtracted = (data: OCRResult) => {
    setExtractedData(data);
  };
  
  const handleExpenseComplete = (expenseData: any) => {
    setDemoExpense(expenseData);
    setShowLeadForm(true);
  };

  const handleLeadSubmit = async (data: {
    email: string;
    name: string;
    interestType: string;
    additionalInfo: string;
    phone?: string;
  }) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('demo_leads').insert({
        email: data.email,
        name: data.name,
        interest_type: data.interestType,
        additional_info: data.additionalInfo,
        phone: data.phone,
        source: 'demo-page',
        receipt_data: extractedData ? JSON.stringify(extractedData) : null
      });

      if (error?.code === '23505') {
        toast("Welcome back! Ready to get started?", {
          description: "Since you've explored our demo, let's get you signed up to unlock the full Nuacha experience!",
          action: {
            label: "Sign Up Now",
            onClick: () => navigate('/signup')
          }
        });
        setDemoComplete(true);
        return;
      }

      if (error) throw error;

      setDemoComplete(true);
      toast.success("Thank you for trying Nuacha!");
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAnother = () => {
    handleImageRemove();
  };
  
  const handleRetry = () => {
    if (currentFile) {
      handleImageUpload(currentFile);
      setShowLeadForm(false);
      setDemoComplete(false);
      setDemoExpense(null);
    }
  };

  return (
    <>
      <DemoBreadcrumbs currentPage="demo" />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-playfair">Try Our Expense Tracker</h1>
            <p className="text-lg text-muted-foreground">
              Experience how Nuacha simplifies expense tracking with intelligent receipt scanning and expense management.
            </p>
          </div>

          {/* Hero Upload Section */}
          <HeroUploadSection 
            onCameraClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.capture = 'environment';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImageUpload(file);
              };
              input.click();
            }}
            onUploadClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImageUpload(file);
              };
              input.click();
            }}
            onFileSelect={handleImageUpload}
            isDemo={true}
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This demo showcases Nuacha's expense tracking functionality. Your uploaded receipt will not be saved or stored. Please do not upload sensitive documents.
            </AlertDescription>
          </Alert>

          {!showLeadForm ? (
            <DemoExpenseForm
              onComplete={handleExpenseComplete}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              onDataExtracted={handleDataExtracted}
              imagePreview={imagePreview}
              extractedData={extractedData}
            />
          ) : !demoComplete ? (
            <Card className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-playfair mb-2">See How Nuacha Works</h2>
                <p className="text-muted-foreground">
                  Enter your details to see how Nuacha can transform your expense management.
                </p>
              </div>
              <LeadCaptureForm onSubmit={handleLeadSubmit} isLoading={isSubmitting} />
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-playfair mb-4">Here's How Your Expense Looks in Nuacha</h2>
                <p className="text-muted-foreground mb-6">
                  This is how your expenses will appear in the app, making it easy to track and manage your spending.
                </p>
              </div>
              
              {demoExpense && <ExpenseCard expense={demoExpense} />}
              
              {extractedData && (
                <div className="mt-8">
                  <h3 className="text-xl font-playfair mb-4">Detailed Receipt Information</h3>
                  <p className="text-muted-foreground mb-6">
                    Nuacha captures extensive details from your receipts, giving you deeper insights into your spending.
                  </p>
                  <DetailedReceiptView 
                    receiptData={extractedData} 
                    receiptImage={imagePreview || undefined}
                    onRetry={handleRetry}
                    expenseId={demoExpense?.id}
                    isDemo={true}
                  />
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button onClick={handleTryAnother} variant="outline">
                  Try Another Receipt
                </Button>
                <UIButton variant="outline" asChild>
                  <Link to="/demo/budget">Try Budget Planning</Link>
                </UIButton>
                <Button size="lg" asChild>
                  <Link to="/options">Explore Nuacha Solutions</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Demo;
