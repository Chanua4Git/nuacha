import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpense } from '@/context/ExpenseContext';
import { format } from 'date-fns';
import CategorySelector from './CategorySelector';
import ReceiptUpload from './ReceiptUpload';
import AmountInput from './expense-form/AmountInput';
import DescriptionInput from './expense-form/DescriptionInput';
import RecurringDateSelector, { DateMode, RecurrencePattern } from './expense-form/RecurringDateSelector';
import PlaceInput from './expense-form/PlaceInput';
import ReplacementSection from './expense-form/ReplacementSection';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import DetailedReceiptView from './DetailedReceiptView';
import { saveReceiptDetailsAndLineItems } from '@/utils/receipt/ocrProcessing';
import FamilySelector from './FamilySelector';
import MultipleMemberSelector from './MultipleMemberSelector';
import { useExpenseMembers } from '@/hooks/useExpenseMembers';
import { supabase } from '@/lib/supabase';
import { useBudgetCategories } from '@/hooks/useBudgetCategories';
import { categorizeFromReceipt } from '@/utils/budgetUtils';

const ExpenseForm = () => {
  const { selectedFamily, createExpense, families } = useExpense();
  const { categories: budgetCategories } = useBudgetCategories();
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
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [budgetCategoryId, setBudgetCategoryId] = useState<string | null>(null);

  // Date selection modes
  const [mode, setMode] = useState<DateMode>('single');
  const [multipleDates, setMultipleDates] = useState<Date[]>([]);
  const [generatedDates, setGeneratedDates] = useState<Date[]>([]);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | undefined>(undefined);
  const [recurrenceStartDate, setRecurrenceStartDate] = useState<Date | undefined>(undefined);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);

  const handleImageUpload = (file: File) => {
    setReceiptImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    // Hide detailed view when uploading a new image
    setShowDetailedView(false);
  };

  const handleImageRemove = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setReceiptImage(null);
    setImagePreview(null);
    setOcrResult(null);
    setShowDetailedView(false);
  };

  // Use suggested category if available and no category is selected
  const handleOcrData = (data: OCRResult) => {
    setOcrResult(data);
    
    if (data.amount) setAmount(data.amount);
    if (data.description) setDescription(data.description);
    if (data.place) setPlace(data.place);
    if (data.date) setDate(data.date);
    
    // Auto-categorize for budget if we have merchant/description data
    if (data.place && data.description && budgetCategories.length > 0) {
      const suggestedCategoryId = categorizeFromReceipt(data.place, data.description, budgetCategories);
      if (suggestedCategoryId) {
        setBudgetCategoryId(suggestedCategoryId);
      }
    }
    
    // Display detailed view automatically if we have line items
    if (data.lineItems && data.lineItems.length > 0) {
      setShowDetailedView(true);
    }
  };

  const handleRetry = () => {
    if (receiptImage) {
      // Re-process the same image
      setImagePreview(null);
      setOcrResult(null);
      const previewUrl = URL.createObjectURL(receiptImage);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFamily) {
      toast("Let's select a family first", {
        description: "Please choose which family this expense belongs to."
      });
      return;
    }
    
    if (!amount || !description || !category || !place) {
      toast("Let's fill in all the details before we save this expense", {
        description: "Some information is still needed to help track this expense properly."
      });
      return;
    }

    // Validate dates based on mode
    if (mode === 'single' && !date) {
      toast("A date helps keep this tidy", {
        description: "Please pick the day this expense belongs to."
      });
      return;
    }

    if (mode === 'multiple' && multipleDates.length === 0) {
      toast("Let's pick the dates this applies to", {
        description: "Select one or more dates for these entries."
      });
      return;
    }

    if (mode === 'recurring' && generatedDates.length === 0) {
      toast("Almost there — generate the dates", {
        description: "Choose a pattern, start/end, then tap Generate."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const datesToCreate: Date[] =
        mode === 'single' && date ? [date] :
        mode === 'multiple' ? multipleDates :
        generatedDates;

      let receiptUrl: string | undefined;
      if (receiptImage) {
        receiptUrl = imagePreview || undefined;
      }

      const createdExpenses: any[] = [];

      for (let i = 0; i < datesToCreate.length; i++) {
        const d = datesToCreate[i];
        const formattedDate = format(d, 'yyyy-MM-dd');

        let nextReplacementDate: string | undefined;
        if (needsReplacement && replacementFrequency) {
          const nextDate = new Date(d);
          nextDate.setDate(nextDate.getDate() + parseInt(replacementFrequency));
          nextReplacementDate = format(nextDate, 'yyyy-MM-dd');
        }

        const newExpense = await createExpense({
          familyId: selectedFamily.id,
          amount: parseFloat(amount),
          description,
          category,
          date: formattedDate,
          place,
          needsReplacement,
          replacementFrequency: replacementFrequency ? parseInt(replacementFrequency) : undefined,
          nextReplacementDate,
          receiptUrl,
          budgetCategoryId
        });

        createdExpenses.push(newExpense);

        // Associate family members for each created expense
        if (selectedMemberIds.length > 0 && newExpense && newExpense.id) {
          try {
            const expenseMembers = selectedMemberIds.map(memberId => ({
              expense_id: newExpense.id,
              member_id: memberId
            }));
            const { error } = await supabase
              .from('expense_members')
              .insert(expenseMembers);
            if (error) throw error;
          } catch (error) {
            console.error('Error associating family members with expense:', error);
            toast("Saved expense, but couldn't associate all family members", {
              description: "The core details are recorded."
            });
          }
        }

        // Save receipt details for the first created expense only
        if (i === 0 && ocrResult && newExpense && newExpense.id) {
          try {
            await saveReceiptDetailsAndLineItems(newExpense.id, ocrResult);
          } catch (error) {
            console.error('Error saving receipt details:', error);
            toast("Saved expense, but some receipt details couldn't be stored", {
              description: "The basic information is recorded correctly."
            });
          }
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
      setShowDetailedView(false);
      setSelectedMemberIds([]);
      setBudgetCategoryId(null);
      setMode('single');
      setMultipleDates([]);
      setGeneratedDates([]);
      setRecurrencePattern(undefined);
      setRecurrenceStartDate(undefined);
      setRecurrenceEndDate(undefined);
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
          {/* Add FamilySelector at the top */}
          <div className="mb-4">
            <FamilySelector />
          </div>
          
          <div>
            <ReceiptUpload
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              onDataExtracted={handleOcrData}
              imagePreview={imagePreview}
            />
          </div>
          
          {ocrResult && imagePreview && (
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
                    receiptData={ocrResult}
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
          
          <RecurringDateSelector
            mode={mode}
            onModeChange={setMode}
            singleDate={date}
            onSingleDateChange={setDate}
            multipleDates={multipleDates}
            onMultipleDatesChange={setMultipleDates}
            recurrencePattern={recurrencePattern}
            onRecurrencePatternChange={setRecurrencePattern}
            recurrenceStartDate={recurrenceStartDate}
            onRecurrenceStartDateChange={setRecurrenceStartDate}
            recurrenceEndDate={recurrenceEndDate}
            onRecurrenceEndDateChange={setRecurrenceEndDate}
            onGeneratedDatesChange={setGeneratedDates}
          />
          
          <PlaceInput
            value={place}
            onChange={setPlace}
          />
          
          {/* Add the MultipleMemberSelector */}
          {selectedFamily && (
            <MultipleMemberSelector
              selectedMemberIds={selectedMemberIds}
              onChange={setSelectedMemberIds}
            />
          )}
          
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
            disabled={isSubmitting || !selectedFamily}
          >
            {isSubmitting ? 'Saving...' : 'Save expense'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ExpenseForm;
