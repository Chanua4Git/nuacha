
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import ReceiptUpload from "@/components/ReceiptUpload";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { OCRResult } from "@/types/expense";
import LeadCaptureForm from "@/components/demo/LeadCaptureForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Demo = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<OCRResult | null>(null);

  const handleImageUpload = (file: File) => {
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
  };

  const handleDataExtracted = (data: OCRResult) => {
    setExtractedData(data);
    setShowLeadForm(true);
  };

  const handleLeadSubmit = async (data: {
    email: string;
    name: string;
    interestType: string;
    additionalInfo: string;
  }) => {
    setIsSubmitting(true);

    try {
      // Store lead in database
      const { error: dbError } = await supabase.from('demo_leads').insert({
        email: data.email,
        name: data.name,
        interest_type: data.interestType,
        additional_info: data.additionalInfo,
        receipt_data: extractedData
      });

      if (dbError) throw dbError;

      // Send email report
      const response = await fetch('https://fjrxqeyexlusjwzzecal.functions.supabase.co/send-receipt-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          receiptData: extractedData,
          interestType: data.interestType
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      setDemoComplete(true);
      toast.success("Report sent! Check your email");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Couldn't send your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-playfair">Try Our Receipt Scanner</h1>
          <p className="text-lg text-muted-foreground">
            Experience how Nuacha simplifies expense tracking with intelligent receipt scanning.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This demo showcases Nuacha's receipt scanning functionality. Your uploaded receipt will not be saved or stored. Please do not upload sensitive documents.
          </AlertDescription>
        </Alert>

        {!showLeadForm ? (
          <Card className="p-6">
            <ReceiptUpload
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              onDataExtracted={handleDataExtracted}
              imagePreview={imagePreview}
            />
          </Card>
        ) : !demoComplete ? (
          <Card className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-playfair mb-2">Get Your Personalized Expense Report</h2>
              <p className="text-muted-foreground">
                Enter your details to receive a detailed analysis of your receipt and see how Nuacha can transform your expense management.
              </p>
            </div>
            <LeadCaptureForm onSubmit={handleLeadSubmit} isLoading={isSubmitting} />
          </Card>
        ) : (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-playfair">Thank You!</h2>
            <p className="text-muted-foreground">
              Your personalized expense report has been sent to your email. While you wait, why not explore more of what Nuacha has to offer?
            </p>
            <Button size="lg" asChild>
              <Link to="/options">Explore Nuacha Solutions</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Demo;
