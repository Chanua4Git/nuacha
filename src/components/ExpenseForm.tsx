
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpense } from '@/context/ExpenseContext';
import { format } from 'date-fns';
import CategorySelector from './CategorySelector';
import ReceiptUpload from './ReceiptUpload';
import AmountInput from './expense-form/AmountInput';
import DescriptionInput from './expense-form/DescriptionInput';
import DateSelector from './expense-form/DateSelector';
import PlaceInput from './expense-form/PlaceInput';
import ReplacementSection from './expense-form/ReplacementSection';
import { toast } from 'sonner';

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
  };

  const handleOcrData = (data: any) => {
    if (data.amount) setAmount(data.amount);
    if (data.description) setDescription(data.description);
    if (data.place) setPlace(data.place);
    if (data.date) setDate(data.date);
    
    // Don't set category automatically as it needs user judgment
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFamily) {
      toast.error('Please select a family first');
      return;
    }
    
    if (!amount || !description || !category || !date || !place) {
      toast.error('Please fill in all required fields');
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
      
      addExpense({
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
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date());
      setPlace('');
      setNeedsReplacement(false);
      setReplacementFrequency('');
      handleImageRemove();
      
      toast.success('Expense added successfully');
      
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('An error occurred while adding the expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Add New Expense</CardTitle>
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
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ExpenseForm;
