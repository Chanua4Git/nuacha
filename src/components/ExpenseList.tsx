import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { getReviewState, toggleReviewed, finishGroup, groupBulkSaves, syncReviewState } from '@/lib/reviewBatch';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { parseReceiptCalendarDate } from '@/utils/receipt/calendarDate';
import { useContextAwareExpense } from '@/hooks/useContextAwareExpense';
import { useExpense } from '@/context/ExpenseContext';
import ExpenseCard from './ExpenseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { format } from 'date-fns';
import { Download, Filter, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { detectDuplicates, getConfidenceColor, getConfidenceLabel, getReasonLabel } from '@/utils/duplicateDetection';
import { toast } from 'sonner';
import PeriodSelector, { PeriodSelection } from '@/components/budget/PeriodSelector';
import ExpenseFilterPanel, { ExpenseFilterValues } from './ExpenseFilterPanel';
import ExpenseFilterChips from './ExpenseFilterChips';
import { useCategories } from '@/hooks/useCategories';
import { Expense } from '@/types/expense';
import DetailedReceiptView from './receipt/DetailedReceiptView';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { StoryExportDialog } from '@/components/story/StoryExportDialog';

const STORY_CREATOR_EMAIL = 'chanuajohnson4@gmail.com';

interface ExpenseListProps {
  onEditExpense?: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ onEditExpense }) => {
  const expenseContext = useContextAwareExpense();
  const { filteredExpenses, expenses: allExpenses, deleteExpense, updateExpense, selectedFamily, setSelectedFamily, families } = useExpense();
  const { user } = useAuth();
  const { categories } = useCategories();
  
  // Initialize to current month for consistency with /budget
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      type: 'monthly',
      startDate,
      endDate,
      displayName: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  });
  
  const [filters, setFilters] = useState<ExpenseFilterValues>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'duplicates' | 'review'>('all');
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [showBulkSelect, setShowBulkSelect] = useState(false);
  
  // Receipt detail view state
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<Expense | null>(null);
  const [selectedExpenseForStory, setSelectedExpenseForStory] = useState<Expense | null>(null);
  const [showRecapStory, setShowRecapStory] = useState(false);
  const canCreateStories = user?.email?.toLowerCase() === STORY_CREATOR_EMAIL;
  
  const updateFilter = useCallback((key: keyof ExpenseFilterValues, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  const removeFilter = useCallback((key: keyof ExpenseFilterValues) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  // Count active filters (excluding searchTerm which is shown separately)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.specificDate) count++;
    if (filters.customStartDate || filters.customEndDate) count++;
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) count++;
    if (filters.categoryIds?.length) count++;
    if (filters.place) count++;
    if (filters.hasReceipt) count++;
    if (filters.paymentMethod) count++;
    return count;
  }, [filters]);

  // Get category name for filter chip display
  const selectedCategoryName = useMemo(() => {
    if (!filters.categoryIds?.length) return undefined;
    const category = categories?.find(c => c.id === filters.categoryIds?.[0]);
    return category?.name;
  }, [filters.categoryIds, categories]);
  
  // Build filter query - prioritize custom date filters over period selector
  const expenses = useMemo(() => {
    // Determine which dates to use
    let startDate: string;
    let endDate: string;
    let specificDate: string | undefined;

    if (filters.specificDate) {
      // Specific date takes precedence
      specificDate = filters.specificDate;
      startDate = filters.specificDate;
      endDate = filters.specificDate;
    } else if (filters.customStartDate || filters.customEndDate) {
      // Custom date range
      startDate = filters.customStartDate || format(selectedPeriod.startDate, 'yyyy-MM-dd');
      endDate = filters.customEndDate || format(selectedPeriod.endDate, 'yyyy-MM-dd');
    } else {
      // Default to period selector dates
      startDate = format(selectedPeriod.startDate, 'yyyy-MM-dd');
      endDate = format(selectedPeriod.endDate, 'yyyy-MM-dd');
    }

    return filteredExpenses({
      categoryId: filters.categoryIds?.[0],
      startDate,
      endDate,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      searchTerm: searchTerm || filters.searchTerm,
      place: filters.place,
    });
  }, [filteredExpenses, filters, selectedPeriod, searchTerm]);
  const duplicateGroups = useMemo(() => detectDuplicates(allExpenses || []), [allExpenses]);
  const duplicateExpenseIds = new Set(duplicateGroups.flatMap(group => group.expenses.map(e => e.id)));
  
  // "Check these": receipts saved together (bulk) are grouped into cards to check against paper copies.
  const [review, setReview] = useState(() => getReviewState());
  const [savedRows, setSavedRows] = useState<{ id: string; created_at: string }[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setReview(getReviewState());
    window.addEventListener('nuacha:review-state', sync);
    void syncReviewState();
    return () => window.removeEventListener('nuacha:review-state', sync);
  }, []);
  useEffect(() => {
    if (!selectedFamily?.id) return;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    supabase.from('expenses').select('id,created_at').eq('family_id', selectedFamily.id).gte('created_at', since)
      .then(({ data }) => setSavedRows((data ?? []) as any));
  }, [selectedFamily?.id, allExpenses]);
  const reviewGroups = useMemo(() => {
    const live = new Set((allExpenses || []).map((e) => e.id));
    return groupBulkSaves(savedRows)
      .map((g) => g.filter((r) => live.has(r.id)))
      .filter((g) => g.length >= 2)
      .map((g) => ({ key: g[0].id, savedAt: g[0].created_at, ids: g.map((r) => r.id) }))
      .filter((g) => !review.finished.includes(g.key));
  }, [savedRows, allExpenses, review.finished]);
  const activeGroup = reviewGroups.find((g) => g.key === openGroup) || null;
  const groupExpenses = useMemo(
    () => (activeGroup ? (allExpenses || []).filter((e) => activeGroup.ids.includes(e.id)) : []),
    [activeGroup, allExpenses],
  );

  const displayExpenses = selectedTab === 'duplicates'
    ? expenses.filter(e => duplicateExpenseIds.has(e.id))
    : selectedTab === 'review'
      ? groupExpenses
      : expenses;
  
  // "Just added" highlight after a Talk-it-through save (?new=id1,id2&fam=familyId)
  const [searchParams, setSearchParams] = useSearchParams();
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const newParam = searchParams.get('new');
  const famParam = searchParams.get('fam');

  useEffect(() => {
    if (!famParam || selectedFamily?.id === famParam) return;
    const fam = families.find((f) => f.id === famParam);
    if (fam) setSelectedFamily(fam);
  }, [famParam, families, selectedFamily?.id, setSelectedFamily]);

  useEffect(() => {
    if (!newParam) return;
    if (famParam && selectedFamily?.id !== famParam) return;
    const ids = newParam.split(',').filter(Boolean);
    const found = allExpenses.filter((e) => ids.includes(e.id));
    if (!found.length) return; // wait for the list to load
    // Show everything just saved together in "Check these", whatever month each receipt is dated.
    setSelectedTab('review');
    setOpenGroup(null);
    setJustAdded(new Set(ids));
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    next.delete('fam');
    setSearchParams(next, { replace: true });
    setTimeout(() => {
      const el = document.querySelector(`[data-expense-id="${ids[0]}"]`);
      (el ?? document.querySelector('main'))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newParam, allExpenses, selectedFamily?.id]);

  useEffect(() => {
    if (!justAdded.size) return;
    const t = setTimeout(() => setJustAdded(new Set()), 8000);
    return () => clearTimeout(t);
  }, [justAdded]);

  const totalAmount = displayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleExpenseSelection = (expenseId: string, selected: boolean) => {
    const newSelected = new Set(selectedExpenses);
    if (selected) {
      newSelected.add(expenseId);
    } else {
      newSelected.delete(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedExpenses.size === 0) return;
    
    try {
      await Promise.all(Array.from(selectedExpenses).map(id => deleteExpense(id)));
      setSelectedExpenses(new Set());
      setShowBulkSelect(false);
      toast.success(`Deleted ${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to delete expenses');
    }
  };

  const handleDeleteSingle = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      toast.success('Expense deleted');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    if (onEditExpense) {
      onEditExpense(expense);
    }
  };

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpenseForDetails(expense);
  };

  const handleCategoryChange = async (expenseId: string, categoryId: string) => {
    try {
      await updateExpense(expenseId, { category: categoryId });
      toast.success('Category updated');
    } catch (error) {
      toast.error('Failed to update category');
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
          {canCreateStories && (
            <Button variant="outline" size="sm" onClick={() => setShowRecapStory(true)}>
              <Download className="mr-2 h-4 w-4" />
              Story recap
            </Button>
          )}
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[150px] flex-1 sm:max-w-[200px]"
          />
          <Button 
            variant="outline" 
            size="icon"
            className="relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > (searchTerm ? 1 : 0) && (
              <Badge 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                variant="destructive"
              >
                {activeFilterCount - (searchTerm ? 1 : 0)}
              </Badge>
            )}
          </Button>
          <Button
            variant={showBulkSelect ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBulkSelect(!showBulkSelect)}
          >
            {showBulkSelect ? 'Cancel' : 'Select'}
          </Button>
          {showBulkSelect && selectedExpenses.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedExpenses.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Expenses</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedExpenses.size} expense{selectedExpenses.size > 1 ? 's' : ''}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Expenses</TabsTrigger>
            <TabsTrigger value="review" className="relative">
              Check these
              {reviewGroups.length > 0 && (
                <Badge className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center text-xs">{reviewGroups.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="relative">
              Duplicates
              {duplicateGroups.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {duplicateGroups.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="duplicates" className="mt-4">
            {duplicateGroups.length > 0 && (
              <div className="space-y-4 mb-6">
                {duplicateGroups.map((group) => (
                  <Card key={group.id} className="border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="destructive" className={getConfidenceColor(group.confidence)}>
                          {getConfidenceLabel(group.confidence)} Confidence
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {getReasonLabel(group.reason)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {group.expenses.map((expense) => {
                        const category = expenses.find(e => e.id === expense.id);
                        return category ? (
                          <ExpenseCard
                            key={expense.id}
                            expense={category}
                            onDelete={handleDeleteSingle}
                            onEdit={onEditExpense ? handleEditExpense : undefined}
                            onViewDetails={handleViewDetails}
                            onDownloadStory={canCreateStories ? setSelectedExpenseForStory : undefined}
                            onCategoryChange={handleCategoryChange}
                            isDuplicate={true}
                            duplicateConfidence={group.confidence}
                            isSelected={selectedExpenses.has(expense.id)}
                            onSelectionChange={handleExpenseSelection}
                            showBulkSelect={showBulkSelect}
                          />
                        ) : null;
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Active Filter Chips */}
        <ExpenseFilterChips
          filters={{ ...filters, searchTerm }}
          onRemoveFilter={removeFilter}
          categoryName={selectedCategoryName}
        />

        {/* Expanded Filter Panel */}
        {showFilters && (
          <ExpenseFilterPanel
            filters={filters}
            onFilterChange={updateFilter}
            onClearAll={clearFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
        
        {selectedTab === 'review' && !activeGroup && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Receipts you saved together are grouped here so you can check them against the paper copies. Tap a group to start.</p>
            {reviewGroups.length === 0 && <p className="text-sm">Nothing waiting to be checked — and that's okay.</p>}
            {reviewGroups.map((g) => {
              const rows = (allExpenses || []).filter((e) => g.ids.includes(e.id));
              const total = rows.reduce((t, e) => t + e.amount, 0);
              const done = g.ids.filter((id) => review.checked.includes(id)).length;
              return (
                <button key={g.key} type="button" onClick={() => setOpenGroup(g.key)}
                  className="w-full text-left rounded-2xl border bg-card p-4 shadow-sm hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{g.ids.length} receipts saved together</span>
                    <Badge variant={done === g.ids.length ? 'default' : 'secondary'}>{done} of {g.ids.length} checked</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(g.savedAt).toLocaleString('en-TT', { dateStyle: 'medium', timeStyle: 'short' })} · ${total.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{rows.map((e) => e.place).join(' · ')}</p>
                </button>
              );
            })}
          </div>
        )}

        {selectedTab === 'review' && activeGroup && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-card p-4 space-y-2">
            <Button size="sm" variant="ghost" className="px-0" onClick={() => setOpenGroup(null)}>← All groups</Button>
            <p className="font-medium">{activeGroup.ids.length} receipts saved together</p>
            <p className="text-sm text-muted-foreground">
              Hold each paper receipt next to its card. Check the store, date and total, fix anything with the pencil, then tap <span className="font-medium">Looks right</span>.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{activeGroup.ids.filter((id) => review.checked.includes(id)).length} of {activeGroup.ids.length} checked</span>
              <Button size="sm" onClick={() => { finishGroup(activeGroup.key); setOpenGroup(null); toast.success("Finished checking. You're doing beautifully."); }}>
                Finish checking
              </Button>
            </div>
          </div>
        )}

        <div className="bg-accent/30 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">{selectedTab === 'review' ? (activeGroup ? 'This group (any date)' : 'Open a group to see its receipts') : selectedPeriod.displayName}</div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Number of Expenses</span>
              <p className="text-2xl font-bold text-right">{displayExpenses.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {displayExpenses.length > 0 ? (
        <div className="space-y-4">
          {displayExpenses.map((expense) => (
            <div key={expense.id} className="space-y-1">
            {selectedTab === 'review' && activeGroup && (
              <Button
                size="sm"
                variant={review.checked.includes(expense.id) ? 'default' : 'outline'}
                className="rounded-2xl"
                onClick={() => toggleReviewed(expense.id)}
              >
                {review.checked.includes(expense.id) ? '✓ Looks right' : 'Looks right?'}
              </Button>
            )}
            <ExpenseCard 
              expense={expense}
              onDelete={handleDeleteSingle}
              onEdit={onEditExpense ? handleEditExpense : undefined}
              onViewDetails={handleViewDetails}
              onDownloadStory={canCreateStories ? setSelectedExpenseForStory : undefined}
              onCategoryChange={handleCategoryChange}
              isDuplicate={duplicateExpenseIds.has(expense.id)}
              isNew={justAdded.has(expense.id)}
              isSelected={selectedExpenses.has(expense.id)}
              onSelectionChange={handleExpenseSelection}
              showBulkSelect={showBulkSelect}
            />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {selectedTab === 'duplicates' ? 'No duplicate expenses found' : selectedTab === 'review' ? '' : 'No expenses found'}
          </p>
        </div>
      )}

      {/* Receipt Detail Sheet */}
      <Sheet open={!!selectedExpenseForDetails} onOpenChange={(open) => !open && setSelectedExpenseForDetails(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Receipt Details</SheetTitle>
            <SheetDescription>
              {selectedExpenseForDetails?.description} - ${selectedExpenseForDetails?.amount.toFixed(2)}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedExpenseForDetails && (
              <DetailedReceiptView expenseId={selectedExpenseForDetails.id} receiptUrl={selectedExpenseForDetails.receiptUrl || selectedExpenseForDetails.receiptImageUrl} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <StoryExportDialog
        open={!!selectedExpenseForStory}
        onOpenChange={(open) => !open && setSelectedExpenseForStory(null)}
        expense={selectedExpenseForStory}
        categories={categories || []}
      />

      <StoryExportDialog
        open={showRecapStory}
        onOpenChange={setShowRecapStory}
        expenses={displayExpenses}
        categories={categories || []}
        families={families}
        selectedFamily={selectedFamily}
        periodLabel={selectedPeriod.displayName}
        initialKind="monthly"
      />
    </div>
  );
};

export default ExpenseList;
