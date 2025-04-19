
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import ReceiptUpload from "@/components/ReceiptUpload";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { OCRResult } from "@/types/expense";

const Demo = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setDemoComplete(false);
  };

  const handleDataExtracted = (data: OCRResult) => {
    setDemoComplete(true);
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
            This demo is for showcasing Nuacha's receipt scanning functionality. Your uploaded receipt will not be saved or stored. Please do not upload sensitive documents.
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <ReceiptUpload
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            onDataExtracted={handleDataExtracted}
            imagePreview={imagePreview}
          />
        </Card>

        {demoComplete && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-playfair">Demo Complete</h2>
            <p className="text-muted-foreground">
              You've successfully tried Nuacha's receipt scanning. Remember, your receipt was not saved. Ready to explore our solutions?
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
