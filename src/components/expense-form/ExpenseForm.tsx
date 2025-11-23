import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { useContextAwareExpense } from '@/hooks/useContextAwareExpense';
import { format } from 'date-fns';
import CategorySelector from '../CategorySelector';
import ReceiptUpload from '../ReceiptUpload';
import MultiImageReceiptUpload from '../receipt/MultiImageReceiptUpload';
import AmountInput from './AmountInput';
import DescriptionInput from './DescriptionInput';
import PlaceInput from './PlaceInput';
import ReplacementSection from './ReplacementSection';
import RecurringDateSelector, { DateMode, RecurrencePattern } from './RecurringDateSelector';
import { toast } from 'sonner';
import { OCRResult } from '@/types/expense';
import { saveReceiptDetailsAndLineItems } from '@/utils/receipt/ocrProcessing';
import { uploadReceiptToOrganizedStorage } from '@/utils/receipt/enhancedStorage';
import { supabase } from '@/lib/supabase';
import PayrollLinkSection, { PayrollLinkState } from './PayrollLinkSection';
import { Input } from '@/components/ui/input';
import { useSupabasePayroll } from '@/hooks/useSupabasePayroll';
import ExpenseTypeSelector, { ExpenseType } from './ExpenseTypeSelector';
import DetailedReceiptView from '../DetailedReceiptView';
import ReceiptImageDisplay from './ReceiptImageDisplay';
import { Camera, Image, Images, Layers, Check, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';
import { useReceiptDuplicateDetection } from '@/hooks/useReceiptDuplicateDetection';
import { ReceiptDuplicateDialog } from '../ReceiptDuplicateDialog';
import { detectPartialReceipt, isReceiptComplete, mergeReceiptPages, calculateLineItemsSubtotal, type ReceiptPage } from '@/utils/receipt/mergeReceipts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import FamilySetupModal from './FamilySetupModal';
import { useFamilies } from '@/hooks/useFamilies';

interface ExpenseFormProps {
  initialOcrData?: OCRResult;
  receiptUrl?: string;
  requireLeadCaptureInDemo?: boolean;
  onScanComplete?: (data: OCRResult, receiptUrl?: string) => void;
  onExpenseCreated?: (ocrData?: OCRResult, receiptUrl?: string) => void;
}

const ExpenseForm = ({ initialOcrData, receiptUrl, requireLeadCaptureInDemo, onScanComplete, onExpenseCreated }: ExpenseFormProps) => {
  const { selectedFamily, createExpense, isDemo } = useContextAwareExpense();
  const { families } = useFamilies();
  
  // Get current user for storage organization
  const [user, setUser] = useState<any>(null);
  
  // Get user info on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  // Family setup modal state
  const [showFamilySetupModal, setShowFamilySetupModal] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [place, setPlace] = useState('');
  const [needsReplacement, setNeedsReplacement] = useState(false);
  const [replacementFrequency, setReplacementFrequency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptImages, setReceiptImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isLongReceiptMode, setIsLongReceiptMode] = useState(false);
  const [showDetailedReceiptView, setShowDetailedReceiptView] = useState(false);

  // Duplicate detection states
  const { checkForReceiptDuplicates, isChecking } = useReceiptDuplicateDetection(selectedFamily?.id);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  
  // Multi-page receipt state
  const [receiptPages, setReceiptPages] = useState<ReceiptPage[]>([]);
  const [isMultiPageMode, setIsMultiPageMode] = useState(false);

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

  const handleImagesUpload = (files: File[]) => {
    setReceiptImages(files);
    if (files.length === 1) {
      // Single image mode - maintain compatibility
      setReceiptImage(files[0]);
      const previewUrl = URL.createObjectURL(files[0]);
      setImagePreview(previewUrl);
    }
  };

  const handleImageRemove = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setReceiptImage(null);
    setImagePreview(null);
    setOcrResult(null);
  };

  const handleImagesRemove = () => {
    setReceiptImages([]);
    handleImageRemove();
  };
  
  // Multi-page receipt helpers
  const addCurrentPage = () => {
    if (!imagePreview || !ocrResult) return;
    
    const newPage: ReceiptPage = {
      pageNumber: receiptPages.length + 1,
      imageUrl: imagePreview,
      ocrResult: ocrResult,
      isPartial: detectPartialReceipt(ocrResult).isPartial
    };
    
    setReceiptPages([...receiptPages, newPage]);
    setIsMultiPageMode(true);
    
    // Clear current image to prepare for next scan
    handleImageRemove();
    
    toast.success(`Page ${newPage.pageNumber} saved`, {
      description: "Ready to scan the next section of your receipt"
    });
  };
  
  const finalizeMerge = () => {
    const allPages: ReceiptPage[] = [...receiptPages];
    
    // Add current page if there is one
    if (imagePreview && ocrResult) {
      allPages.push({
        pageNumber: allPages.length + 1,
        imageUrl: imagePreview,
        ocrResult: ocrResult,
        isPartial: detectPartialReceipt(ocrResult).isPartial
      });
    }
    
    if (allPages.length === 0) return;
    
    // Merge all pages
    const mergedResult = mergeReceiptPages(allPages);
    
    // Update form with merged data
    handleOcrData(mergedResult, allPages[0].imageUrl);
    
    // Reset multi-page state
    setReceiptPages([]);
    setIsMultiPageMode(false);
    
    toast.success("Receipt merged successfully", {
      description: `Combined ${allPages.length} pages with ${mergedResult.lineItems?.length || 0} items`
    });
  };

  const handleOcrData = (data: OCRResult, receiptImageUrl?: string) => {
    console.log('🔄 handleOcrData called with:', data);
    
    // Check if we need to gate this with lead capture in demo mode
    if (requireLeadCaptureInDemo && isDemo && onScanComplete) {
      console.log('🚪 Gating OCR data for lead capture in demo mode');
      onScanComplete(data, receiptImageUrl);
      return;
    }
    
    setOcrResult(data);

    // Set amount (OCRResult.amount is string type)
    if (data.amount) {
      console.log('💰 Setting amount:', data.amount);
      setAmount(data.amount);
    }
    
    if (data.description) {
      console.log('📝 Setting description:', data.description);
      setDescription(data.description);
    }
    
    if (data.place) {
      console.log('📍 Setting place:', data.place);
      setPlace(data.place);
    }
    
    if (data.date) {
      console.log('📅 Setting date:', data.date);
      setSingleDate(data.date);
    }

    // Auto-show detailed view if line items are detected or structured data exists
    if (data.lineItems && data.lineItems.length > 0) {
      setShowDetailedReceiptView(true);
    } else if (data.storeDetails || data.total || data.tax) {
      setShowDetailedReceiptView(true);
    }

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

    // Check for duplicates if we have OCR data (scanned receipt)
    if (ocrResult && selectedFamily) {
      try {
        const duplicateCheck = await checkForReceiptDuplicates(
          ocrResult,
          selectedFamily.id,
          amount,
          description,
          place,
          datesToProcess[0]
        );

        if (duplicateCheck.hasDuplicates) {
          // Store submission data for later use
          setPendingSubmission({
            datesToProcess,
            receiptUrl: null, // Will be set later
            payrollPeriodId: null,
            payrollEntryId: null,
          });
          setDuplicateCheckResult(duplicateCheck);
          setShowDuplicateDialog(true);
          return; // Don't proceed with submission yet
        }
      } catch (error) {
        console.warn('Duplicate check failed, proceeding with submission:', error);
        // Continue with submission if duplicate check fails
      }
    }

    await proceedWithSubmission();
  };

  const proceedWithSubmission = async () => {
    if (!selectedFamily) return;

    // Reconstruct datesToProcess within this function
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

    setIsSubmitting(true);

    try {
      let receiptUrlToUse: string | undefined;

      // Priority 1: Use pre-authenticated receipt URL if available (from landing page scan)
      if (receiptUrl) {
        console.log('📎 Using pre-authenticated receipt URL:', receiptUrl);
        receiptUrlToUse = receiptUrl;
      } 
      // Priority 2: Upload new receipt image if user added one directly in the form
      else if (receiptImage && user) {
        console.log('📤 Uploading new receipt image to storage');
        const storageMetadata = {
          familyId: selectedFamily?.id || '',
          categoryName: category || 'uncategorized',
          description: description,
          amount: parseFloat(amount),
          date: datesToProcess[0]
        };
        
        receiptUrlToUse = await uploadReceiptToOrganizedStorage(
          receiptImage, 
          user.id, 
          storageMetadata
        );
        console.log('✅ Receipt uploaded:', receiptUrlToUse);
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

      // Get budget category mapping
      let budgetCategoryId: string | null = null;
      if (user) {
        try {
          const { data, error } = await supabase.rpc('get_or_create_budget_category', {
            user_uuid: user.id,
            family_uuid: selectedFamily.id,
            category_name: category
          });
          
          if (!error && data) {
            budgetCategoryId = data;
            console.log('✅ Budget category mapped:', { category, budgetCategoryId });
          }
        } catch (error) {
          console.error('❌ Failed to map budget category:', error);
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
          receiptUrl: receiptUrlToUse,
          receiptImageUrl: receiptUrlToUse || undefined, // Store direct image URL for easy access
          expenseType,
          budgetCategoryId, // Now properly mapped to budget categories
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
      setIsLongReceiptMode(false);
      setShowDetailedReceiptView(false);
      handleImagesRemove();

      // Reset duplicate detection states
      setShowDuplicateDialog(false);
      setDuplicateCheckResult(null);
      setPendingSubmission(null);

      const expenseCount = createdExpenses.length;
      toast.success(`${expenseCount} expense${expenseCount > 1 ? 's' : ''} added successfully${payrollLink.enabled ? ' and payroll logged' : ''}`);

      // Call the callback after successful expense creation
      if (onExpenseCreated) {
        onExpenseCreated(initialOcrData, receiptUrlToUse);
      }

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

  const handleDuplicateConfirm = async () => {
    await proceedWithSubmission();
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false);
    setDuplicateCheckResult(null);
    setPendingSubmission(null);
    toast("We've kept your expense details", {
      description: "You can modify them and try again."
    });
  };

  // Handle initial OCR data from props (e.g., from Demo page)
  useEffect(() => {
    if (initialOcrData) {
      console.log('🎯 Using initial OCR data from props:', initialOcrData);
      console.log('🔍 Demo CategorySelector debug - place:', initialOcrData.place, 'lineItems:', initialOcrData.lineItems?.length || 0);
      
      // Bypass gating logic and directly set OCR result and form fields
      setOcrResult(initialOcrData);

      // Set form fields from OCR data
      if (initialOcrData.amount) {
        console.log('💰 Setting amount from initial data:', initialOcrData.amount);
        setAmount(initialOcrData.amount);
      }
      
      if (initialOcrData.description) {
        console.log('📝 Setting description from initial data:', initialOcrData.description);
        setDescription(initialOcrData.description);
      }
      
      if (initialOcrData.place) {
        console.log('📍 Setting place from initial data:', initialOcrData.place);
        setPlace(initialOcrData.place);
      }
      
      if (initialOcrData.date) {
        console.log('📅 Setting date from initial data:', initialOcrData.date);
        setSingleDate(initialOcrData.date);
      }

      // Auto-show detailed view if line items are detected or structured data exists
      if (initialOcrData.lineItems && initialOcrData.lineItems.length > 0) {
        console.log('📋 Showing detailed receipt view - line items found:', initialOcrData.lineItems.length);
        setShowDetailedReceiptView(true);
      } else if (initialOcrData.storeDetails || initialOcrData.total || initialOcrData.tax) {
        console.log('📋 Showing detailed receipt view - structured data found');
        setShowDetailedReceiptView(true);
      }
      
      // Set receipt image preview if URL provided
      if (receiptUrl) {
        setImagePreview(receiptUrl);
      }
    }
  }, [initialOcrData, receiptUrl]);
  
  // Check if user needs to create a family before adding expense
  useEffect(() => {
    if (initialOcrData && !isDemo && families.length === 0 && !showFamilySetupModal) {
      setShowFamilySetupModal(true);
    }
  }, [initialOcrData, isDemo, families.length, showFamilySetupModal]);
  
  const handleFamilyCreated = () => {
    setShowFamilySetupModal(false);
    toast.success("Family created successfully", {
      description: "You can now save your expense"
    });
  };
  
  // Auto-detect partial receipts and enter multi-page mode
  useEffect(() => {
    if (ocrResult && !isMultiPageMode) {
      const partialCheck = detectPartialReceipt(ocrResult);
      if (partialCheck.isPartial) {
        setIsMultiPageMode(true);
      }
    }
  }, [ocrResult]);
  
  // Calculate receipt completion status
  const partialDetection = ocrResult ? detectPartialReceipt(ocrResult) : null;
  const isComplete = ocrResult ? isReceiptComplete(ocrResult) : false;
  const totalPages = receiptPages.length + (imagePreview && ocrResult ? 1 : 0);

  // Show family setup modal if user has scanned receipt but no families
  if (showFamilySetupModal) {
    return (
      <>
        <FamilySetupModal 
          open={showFamilySetupModal}
          onFamilyCreated={handleFamilyCreated}
        />
        <Card className="w-full max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your receipt has been scanned successfully. Please create a family to continue.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </>
    );
  }

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

          {/* Receipt Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Receipt Upload Mode</span>
            </div>
            <Button
              type="button"
              variant={isLongReceiptMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLongReceiptMode(!isLongReceiptMode)}
              className="gap-2"
            >
              {isLongReceiptMode ? (
                <>
                  <Images className="h-4 w-4" />
                  Long Receipt
                </>
              ) : (
                <>
                  <Image className="h-4 w-4" />
                  Single Receipt
                </>
              )}
            </Button>
          </div>

          {isLongReceiptMode ? (
            <MultiImageReceiptUpload
              onImagesUpload={handleImagesUpload}
              onImagesRemove={handleImagesRemove}
              onDataExtracted={handleOcrData}
              isLongReceiptMode={isLongReceiptMode}
              onToggleLongReceiptMode={() => setIsLongReceiptMode(!isLongReceiptMode)}
              familyId={selectedFamily?.id}
            />
          ) : (
            <ReceiptUpload
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              onDataExtracted={handleOcrData}
              imagePreview={imagePreview}
              familyId={selectedFamily?.id}
              disableInternalCTAs={true}
            />
          )}

          {/* Display receipt image preview */}
          {imagePreview && (
            <ReceiptImageDisplay
              imageUrl={imagePreview}
              imagePreview={imagePreview}
              description="Receipt Preview"
              confidence={ocrResult?.confidence}
              onViewReceipt={() => setShowDetailedReceiptView(true)}
            />
          )}

          {/* Detailed Receipt View */}
          {ocrResult && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDetailedReceiptView(!showDetailedReceiptView)}
                className="w-full"
              >
                {showDetailedReceiptView ? "Hide receipt details" : "Show receipt details"}
              </Button>
              
              {showDetailedReceiptView && (
                <div className="border rounded-lg p-4 bg-background/50">
                  <DetailedReceiptView
                    receiptData={ocrResult}
                    receiptImage={imagePreview}
                    isDemo={isDemo}
                    onRetry={() => {
                      setOcrResult(null);
                      setShowDetailedReceiptView(false);
                    }}
                    onScanNextPage={addCurrentPage}
                    onFinalize={finalizeMerge}
                    canFinalize={totalPages > 1}
                    isComplete={isComplete}
                    totalPages={totalPages}
                  />
                </div>
              )}
              
              {/* Multi-page receipt CTAs - show ONLY when details view is HIDDEN to avoid duplication */}
              {!showDetailedReceiptView && (
                <div className="space-y-3">
                  {/* Page counter - only show when pages have been saved */}
                  {receiptPages.length > 0 && (
                    <div className="text-center">
                      <Badge variant="outline" className="gap-2">
                        <Layers className="h-3 w-3" />
                        Scanning page {receiptPages.length + 1} • {receiptPages.length} saved
                      </Badge>
                    </div>
                  )}
                  
                  {/* Partial receipt alert with CTA - ALWAYS show when partial, regardless of mode */}
                  {imagePreview && partialDetection?.isPartial && !isComplete && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-900">Partial Receipt Detected</AlertTitle>
                      <AlertDescription className="text-yellow-800 space-y-3">
                        <p>{partialDetection.reason}</p>
                        {ocrResult?.lineItems && ocrResult.lineItems.length > 0 && (
                          <p className="text-sm">
                            Running subtotal: ${calculateLineItemsSubtotal(ocrResult.lineItems).toFixed(2)} 
                            ({ocrResult.lineItems.length} items so far)
                          </p>
                        )}
                        <Button
                          type="button"
                          onClick={addCurrentPage}
                          className="w-full"
                          size="sm"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Scan Next Page of Receipt
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Complete receipt alert */}
                  {isComplete && receiptPages.length > 0 && (
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">Receipt Complete!</AlertTitle>
                      <AlertDescription className="text-green-800">
                        This page shows the final total. Ready to finalize your {totalPages}-page receipt.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Finalize button */}
                  {totalPages > 1 && (
                    <Button
                      type="button"
                      onClick={finalizeMerge}
                      className={cn(
                        "w-full",
                        isComplete && "bg-green-600 hover:bg-green-700"
                      )}
                      size="lg"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Finalize Receipt ({totalPages} pages)
                    </Button>
                  )}
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
            place={place || ocrResult?.storeDetails?.name}
            lineItems={ocrResult?.lineItems ? ocrResult.lineItems.map(item => ({ 
              description: item.description, 
              confidence: 0.8 // Default confidence for type compatibility
            } as any)) : undefined}
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
            disabled={isSubmitting || !selectedFamily || isChecking}
          >
            {isSubmitting ? 'Adding Expense...' : isChecking ? 'Checking for duplicates...' : 'Add Expense'}
          </Button>
        </CardFooter>
      </form>

      {/* Duplicate Detection Dialog */}
      <ReceiptDuplicateDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicateGroups={duplicateCheckResult?.duplicateGroups || []}
        onConfirm={handleDuplicateConfirm}
        onCancel={handleDuplicateCancel}
      />
      
      {/* Mobile sticky footer for multi-page actions - show when receipt is scanned */}
      {imagePreview && ocrResult && (partialDetection?.isPartial || totalPages > 1) && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden z-50 space-y-2">
          {!isComplete && partialDetection?.isPartial && (
            <Button
              type="button"
              onClick={addCurrentPage}
              className="w-full"
              size="lg"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan Next Page
            </Button>
          )}
          {totalPages > 1 && (
            <Button
              type="button"
              onClick={finalizeMerge}
              variant={isComplete ? "default" : "outline"}
              className={cn(
                "w-full",
                isComplete && "bg-green-600 hover:bg-green-700"
              )}
              size="lg"
            >
              <Layers className="h-4 w-4 mr-2" />
              Finalize ({totalPages} pages)
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default ExpenseForm;
