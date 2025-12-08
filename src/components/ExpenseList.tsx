import React, { useMemo, useState, useCallback } from 'react';
import { useContextAwareExpense } from '@/hooks/useContextAwareExpense';
import { useExpense } from '@/context/ExpenseContext';
import ExpenseCard from './ExpenseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Filter, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { detectDuplicates, getConfidenceColor, getConfidenceLabel, getReasonLabel } from '@/utils/duplicateDetection';
import { toast } from 'sonner';
import PeriodSelector, { PeriodSelection } from '@/components/budget/PeriodSelector';
import ExpenseFilterPanel, { ExpenseFilterValues } from './ExpenseFilterPanel';
import ExpenseFilterChips from './ExpenseFilterChips';
import { useCategories } from '@/hooks/useCategories';

const ExpenseList = () => {
  const expenseContext = useContextAwareExpense();
  const { filteredExpenses, expenses: allExpenses, deleteExpense } = useExpense();
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
  const [selectedTab, setSelectedTab] = useState<'all' | 'duplicates'>('all');
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [showBulkSelect, setShowBulkSelect] = useState(false);
  
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
  
  const displayExpenses = selectedTab === 'duplicates' 
    ? expenses.filter(e => duplicateExpenseIds.has(e.id))
    : expenses;
  
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
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </div>
        
        <div className="flex justify-end items-center gap-2 mb-4">
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[200px]"
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

        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'all' | 'duplicates')}>
          <TabsList>
            <TabsTrigger value="all">All Expenses</TabsTrigger>
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
        
        <div className="bg-accent/30 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">{selectedPeriod.displayName}</div>
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
            <ExpenseCard 
              key={expense.id} 
              expense={expense}
              onDelete={handleDeleteSingle}
              isDuplicate={duplicateExpenseIds.has(expense.id)}
              isSelected={selectedExpenses.has(expense.id)}
              onSelectionChange={handleExpenseSelection}
              showBulkSelect={showBulkSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {selectedTab === 'duplicates' ? 'No duplicate expenses found' : 'No expenses found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
