
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import CategorySelector from '@/components/CategorySelector';
import ReceiptUpload from '@/components/ReceiptUpload';
import AmountInput from '@/components/expense-form/AmountInput';
import DescriptionInput from '@/components/expense-form/DescriptionInput';
import DateSelector from '@/components/expense-form/DateSelector';
import PlaceInput from '@/components/expense-form/PlaceInput';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import DetailedReceiptView from '@/components/DetailedReceiptView';
import { format } from 'date-fns';

interface DemoExpenseFormProps {
  onComplete: (data: any) => void;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onDataExtracted: (data: OCRResult) => void;
  imagePreview: string | null;
  extractedData: OCRResult | null;
}

const DemoExpenseForm = ({ 
  onComplete, 
  onImageUpload,
  onImageRemove,
  onDataExtracted,
  imagePreview,
  extractedData
}: DemoExpenseFormProps) => {
  const [amount, setAmount] = useState(extractedData?.amount || '');
  const [description, setDescription] = useState(extractedData?.description || '');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date | undefined>(extractedData?.date || new Date());
  const [place, setPlace] = useState(extractedData?.place || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const handleRetry = () => {
    if (imagePreview) {
      // Re-process the current image - this would require accessing the current file
      // In demo mode, we'll just notify the user
      toast("We would re-process your receipt in the full app");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !category || !date || !place) {
      toast("Let's fill in all the details before we continue", {
        description: "Some information is still needed to help track this expense properly."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Prepare demo expense data
      const demoExpense = {
        id: 'demo-' + Math.random().toString(36).substring(2, 9),
        familyId: 'demo',
        amount: parseFloat(amount),
        description,
        category,
        date: formattedDate,
        place,
        receiptUrl: imagePreview || undefined
      };
      
      // Send the demo expense data to the parent component
      onComplete(demoExpense);
      
    } catch (error) {
      console.error('Error in demo expense form:', error);
      toast("Something didn't go as planned", {
        description: "We weren't able to process your demo expense. Would you like to try again?"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Try Nuacha's Expense Tracking</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <ReceiptUpload
              onImageUpload={onImageUpload}
              onImageRemove={onImageRemove}
              onDataExtracted={onDataExtracted}
              imagePreview={imagePreview}
            />
          </div>
          
          {extractedData && imagePreview && (
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDetailedView(!showDetailedView)}
                className="w-full"
              >
                {showDetailedView ? "Hide receipt details" : "Show receipt details"}
              </Button>
              
              {showDetailedView && (
                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                  <DetailedReceiptView
                    receiptData={extractedData}
                    receiptImage={imagePreview}
                    onRetry={handleRetry}
                  />
                </div>
              )}
            </div>
          )}

          <AmountInput 
            value={amount}
            onChange={setAmount}
          />
          
          <DescriptionInput
            value={description}
            onChange={setDescription}
          />
          
          <CategorySelector
            value={category}
            onChange={setCategory}
          />
          
          <DateSelector
            date={date}
            onSelect={setDate}
          />
          
          <PlaceInput
            value={place}
            onChange={setPlace}
          />
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DemoExpenseForm;
