import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpense } from '@/context/ExpenseContext';
import { format } from 'date-fns';
import CategorySelector from '../CategorySelector';
import ReceiptUpload from '../ReceiptUpload';
import AmountInput from './AmountInput';
import DescriptionInput from './DescriptionInput';
import PlaceInput from './PlaceInput';
import ReplacementSection from './ReplacementSection';
import RecurringDateSelector, { DateMode, RecurrencePattern } from './RecurringDateSelector';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import { saveReceiptDetailsAndLineItems } from '@/utils/receipt/ocrProcessing';
import PayrollLinkSection, { PayrollLinkState } from './PayrollLinkSection';
import { Input } from '@/components/ui/input';
import { useSupabasePayroll } from '@/hooks/useSupabasePayroll';
import ExpenseTypeSelector, { ExpenseType } from './ExpenseTypeSelector';

const ExpenseForm = () => {
  const { selectedFamily, createExpense } = useExpense();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [place, setPlace] = useState('');
  const [needsReplacement, setNeedsReplacement] = useState(false);
  const [replacementFrequency, setReplacementFrequency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  // Date states
  const [dateMode, setDateMode] = useState<DateMode>('single');
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [multipleDates, setMultipleDates] = useState<Date[]>([]);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>();
  const [recurrenceStartDate, setRecurrenceStartDate] = useState<Date | undefined>();
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>();
  const [generatedDates, setGeneratedDates] = useState<Date[]>([]);

  // New: Paid on date (optional)
  const [paidOnDate, setPaidOnDate] = useState<Date | undefined>();

  // New: Expense type state
  const [expenseType, setExpenseType] = useState<ExpenseType>('actual');

  // New: Payroll linking state and data via existing payroll hook
  const {
    employees,
    payrollPeriods,
    addEmployee,
    addPayrollPeriod,
    addPayrollEntry,
  } = useSupabasePayroll();

  const [payrollLink, setPayrollLink] = useState<PayrollLinkState>({
    enabled: false,
    periodMode: 'existing',
  });

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

    if (data.amount) setAmount(data.amount);
    if (data.description) setDescription(data.description);
    if (data.place) setPlace(data.place);
    if (data.date) setSingleDate(data.date);

    // Don't set category automatically as it needs user judgment
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFamily) {
      toast.error('Please select a family first');
      return;
    }

    if (!amount || !description || !category || !place) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Determine which dates to use
    let datesToProcess: Date[] = [];
    if (dateMode === 'single' && singleDate) {
      datesToProcess = [singleDate];
    } else if (dateMode === 'multiple') {
      datesToProcess = multipleDates;
    } else if (dateMode === 'recurring') {
      datesToProcess = generatedDates;
    }

    if (datesToProcess.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    // If payroll is enabled, validate minimal fields before proceeding
    if (payrollLink.enabled) {
      if (!payrollLink.employeeId) {
        toast.error('Please select an employee for the payroll entry');
        return;
      }
      if (payrollLink.periodMode === 'existing' && !payrollLink.existingPeriodId) {
        toast.error('Please select a payroll period or switch to creating a new one');
        return;
      }
      if (payrollLink.periodMode === 'new') {
        if (!payrollLink.newPeriodStart || !payrollLink.newPeriodEnd) {
          toast.error('Please provide start and end dates for the new payroll period');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      let receiptUrl: string | undefined;
      if (receiptImage) {
        receiptUrl = imagePreview || undefined;
      }

      const createdExpenses = [];

      // Optional payroll setup
      let payrollPeriodId: string | undefined;
      let payrollEntryId: string | undefined;

      if (payrollLink.enabled) {
        // Determine or create period
        if (payrollLink.periodMode === 'existing') {
          payrollPeriodId = payrollLink.existingPeriodId!;
        } else {
          const newPeriodPayload = {
            name: payrollLink.newPeriodName || `Period ${format(new Date(), 'yyyy-MM-dd')}`,
            start_date: format(payrollLink.newPeriodStart || datesToProcess[0], 'yyyy-MM-dd'),
            end_date: format(payrollLink.newPeriodEnd || datesToProcess[datesToProcess.length - 1], 'yyyy-MM-dd'),
            pay_date: format((payrollLink.newPeriodPayDate || paidOnDate || new Date()), 'yyyy-MM-dd'),
          };
          const newPeriod = await addPayrollPeriod(newPeriodPayload as any);
          payrollPeriodId = newPeriod?.id;
        }

        // Create payroll entry
        if (payrollPeriodId) {
          const employee = employees.find(e => e.id === payrollLink.employeeId);
          if (!employee) {
            throw new Error('Selected employee not found');
          }

          const daysWorked = payrollLink.daysWorked ?? datesToProcess.length;
          const payrollInput = { days_worked: daysWorked } as any;

          const entry = await addPayrollEntry(payrollPeriodId, employee, payrollInput);
          payrollEntryId = entry?.id;
        }
      }

      // Create expenses for each date
      for (const date of datesToProcess) {
        const formattedDate = format(date, 'yyyy-MM-dd');

        let nextReplacementDate: string | undefined;
        if (needsReplacement && replacementFrequency) {
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + parseInt(replacementFrequency));
          nextReplacementDate = format(nextDate, 'yyyy-MM-dd');
        }

        const paidOn = paidOnDate ? format(paidOnDate, 'yyyy-MM-dd') : undefined;

        const newExpense = await createExpense({
          familyId: selectedFamily!.id,
          amount: parseFloat(amount),
          description,
          category,
          date: formattedDate,
          place,
          needsReplacement,
          replacementFrequency: replacementFrequency ? parseInt(replacementFrequency) : undefined,
          nextReplacementDate,
          receiptUrl,
          expenseType,
          // Extra fields supported by backend; types may not include them, so they are passed-through
          paidOnDate: paidOn,
          payrollPeriodId: payrollPeriodId,
          payrollEntryId: payrollEntryId,
        } as any);

        createdExpenses.push(newExpense);

        // If we have OCR data and the expense was created successfully, save receipt details
        if (ocrResult && newExpense && newExpense.id) {
          try {
            await saveReceiptDetailsAndLineItems(newExpense.id, ocrResult);
            console.log('✅ Receipt details and line items saved');
          } catch (error) {
            console.error('Error saving receipt details:', error);
            // Do not fail entire submission on receipt details issues
          }
        }
      }

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setSingleDate(new Date());
      setMultipleDates([]);
      setGeneratedDates([]);
      setRecurrencePattern(undefined);
      setRecurrenceStartDate(undefined);
      setRecurrenceEndDate(undefined);
      setDateMode('single');
      setPlace('');
      setNeedsReplacement(false);
      setReplacementFrequency('');
      setOcrResult(null);
      setPaidOnDate(undefined);
      setExpenseType('actual');
      setPayrollLink({ enabled: false, periodMode: 'existing' });
      handleImageRemove();

      const expenseCount = createdExpenses.length;
      toast.success(`${expenseCount} expense${expenseCount > 1 ? 's' : ''} added successfully${payrollLink.enabled ? ' and payroll logged' : ''}`);

    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('An error occurred while adding the expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute suggestions for period creation from selected dates
  const suggestedStart = (() => {
    if (dateMode === 'single' && singleDate) return singleDate;
    if (dateMode === 'multiple' && multipleDates.length) return new Date(Math.min(...multipleDates.map(d => d.getTime())));
    if (dateMode === 'recurring' && generatedDates.length) return new Date(Math.min(...generatedDates.map(d => d.getTime())));
    return undefined;
  })();

  const suggestedEnd = (() => {
    if (dateMode === 'single' && singleDate) return singleDate;
    if (dateMode === 'multiple' && multipleDates.length) return new Date(Math.max(...multipleDates.map(d => d.getTime())));
    if (dateMode === 'recurring' && generatedDates.length) return new Date(Math.max(...generatedDates.map(d => d.getTime())));
    return undefined;
  })();

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Add New Expense</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Expense Type Selector */}
          <ExpenseTypeSelector
            value={expenseType}
            onChange={setExpenseType}
          />

          <ReceiptUpload
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            onDataExtracted={handleOcrData}
            imagePreview={imagePreview}
          />

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
            mode={dateMode}
            onModeChange={setDateMode}
            singleDate={singleDate}
            onSingleDateChange={setSingleDate}
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

          {/* Paid on date (optional) */}
          <div className="grid gap-1">
            <label className="text-sm font-medium">Paid on date (optional)</label>
            <Input
              type="date"
              value={paidOnDate ? paidOnDate.toISOString().slice(0,10) : ''}
              onChange={(e) => setPaidOnDate(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
          
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

          {/* Payroll linking */}
          <PayrollLinkSection
            state={payrollLink}
            onChange={setPayrollLink}
            employees={employees}
            payrollPeriods={payrollPeriods}
            onQuickAddEmployee={addEmployee as any}
            suggestedStart={suggestedStart}
            suggestedEnd={suggestedEnd}
            suggestedPayDate={paidOnDate}
          />
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
