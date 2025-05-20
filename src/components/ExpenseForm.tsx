
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpense } from '@/context/ExpenseContext';
import { format } from 'date-fns';
import CategorySelector from './CategorySelector';
import ReceiptUpload from './receipt/ReceiptUpload';
import AmountInput from './expense-form/AmountInput';
import DescriptionInput from './expense-form/DescriptionInput';
import DateSelector from './expense-form/DateSelector';
import PlaceInput from './expense-form/PlaceInput';
import ReplacementSection from './expense-form/ReplacementSection';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import { saveReceiptDetailsAndLineItems } from '@/utils/receipt/ocrProcessing';

const ExpenseForm = () => {
  const { selectedFamily, addExpense } = useExpense();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [place, setPlace] = useState('');
  const [needsReplacement, setNeedsReplacement] = useState(false);
  const [replacementFrequency, setReplacementFrequency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const handleImageUpload = (file: File) => {
    setReceiptImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleImageRemove = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setReceiptImage(null);
    setImagePreview(null);
    setOcrResult(null);
  };

  const handleOcrData = (data: OCRResult) => {
    setOcrResult(data);
    
    if (data.amount) setAmount(data.amount.toString());
    if (data.description) setDescription(data.description);
    if (data.place) setPlace(data.place);
    if (data.date) setDate(data.date);
    
    // Don't set category automatically as it needs user judgment
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFamily) {
      toast("Let's select a family first", {
        description: "Choose which family this expense belongs to."
      });
      return;
    }
    
    if (!amount || !description || !category || !date || !place) {
      toast("Let's fill in all the details before we save this expense", {
        description: "Some information is still needed to help track this expense properly."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      let receiptUrl: string | undefined;
      if (receiptImage) {
        receiptUrl = imagePreview || undefined;
      }
      
      let nextReplacementDate: string | undefined;
      if (needsReplacement && replacementFrequency) {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + parseInt(replacementFrequency));
        nextReplacementDate = format(nextDate, 'yyyy-MM-dd');
      }
      
      // Add expense first
      const newExpense = await addExpense({
        familyId: selectedFamily.id,
        amount: parseFloat(amount),
        description,
        category,
        date: formattedDate,
        place,
        needsReplacement,
        replacementFrequency: replacementFrequency ? parseInt(replacementFrequency) : undefined,
        nextReplacementDate,
        receiptUrl
      });
      
      // If we have OCR data and the expense was created successfully, save receipt details
      if (ocrResult && newExpense && newExpense.id) {
        try {
          console.log('Saving receipt details and line items for expense:', newExpense.id);
          const result = await saveReceiptDetailsAndLineItems(newExpense.id, ocrResult);
          console.log('✅ Receipt details and line items saved:', result);
        } catch (error) {
          console.error('❌ Error saving receipt details:', error);
          // We don't want to fail the whole submission if just the receipt details fail
        }
      }
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date());
      setPlace('');
      setNeedsReplacement(false);
      setReplacementFrequency('');
      setOcrResult(null);
      handleImageRemove();
      
      toast.success("All set. You're doing beautifully.");
      
    } catch (error) {
      console.error('Error adding expense:', error);
      toast("Something didn't go as planned", {
        description: "We weren't able to save your expense. Would you like to try again?"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Ready to gently log today's spending?</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <ReceiptUpload
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              onDataExtracted={handleOcrData}
              imagePreview={imagePreview}
            />
          </div>

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
          
          {selectedFamily?.id === '1' && (
            <ReplacementSection
              needsReplacement={needsReplacement}
              replacementFrequency={replacementFrequency}
              onNeedsReplacementChange={setNeedsReplacement}
              onFrequencyChange={setReplacementFrequency}
            />
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save expense'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ExpenseForm;
