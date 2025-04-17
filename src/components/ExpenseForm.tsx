import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useExpense } from '@/context/ExpenseContext';
import CategorySelector from './CategorySelector';
import ReceiptUpload from './ReceiptUpload';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFamily) {
      alert('Please select a family first');
      return;
    }
    
    if (!amount || !description || !category || !date || !place) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      let receiptUrl: string | undefined;
      if (receiptImage) {
        // For now, we'll just store the image preview URL
        // In a real app, you would upload this to a storage service
        receiptUrl = imagePreview || undefined;
      }
      
      // Calculate next replacement date if needed
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
      
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('An error occurred while adding the expense');
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
            <Label htmlFor="receipt">Receipt Image</Label>
            <ReceiptUpload
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              imagePreview={imagePreview}
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          
          <CategorySelector
            value={category}
            onChange={setCategory}
          />
          
          <div>
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="place">Place</Label>
            <Input
              id="place"
              placeholder="Where was this expense made?"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          
          {selectedFamily?.id === '1' && (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="needs-replacement">Needs Replacement</Label>
                  <p className="text-sm text-muted-foreground">
                    Will this item need to be replaced in the future?
                  </p>
                </div>
                <Switch
                  id="needs-replacement"
                  checked={needsReplacement}
                  onCheckedChange={setNeedsReplacement}
                />
              </div>
              
              {needsReplacement && (
                <div>
                  <Label htmlFor="replacement-frequency">Replacement Frequency (days)</Label>
                  <Input
                    id="replacement-frequency"
                    type="number"
                    placeholder="e.g., 30, 90, 180"
                    value={replacementFrequency}
                    onChange={(e) => setReplacementFrequency(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
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
