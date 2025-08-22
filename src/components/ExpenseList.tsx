
import { useMemo, useState } from 'react';
import { useExpense, ExpenseFilters } from '@/context/ExpenseContext';
import ExpenseCard from './ExpenseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Filter, X, Trash2, Copy, Search } from 'lucide-react';
import CategorySelector from './CategorySelector';
import { Badge } from '@/components/ui/badge';
import { detectDuplicates, getConfidenceColor, getConfidenceLabel, getReasonLabel } from '@/utils/duplicateDetection';
import { toast } from 'sonner';

const ExpenseList = () => {
  const { filteredExpenses, expenses: allExpenses, deleteExpense, selectedFamily } = useExpense();
  
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'duplicates'>('all');
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [showBulkSelect, setShowBulkSelect] = useState(false);
  
  const updateFilter = (key: keyof ExpenseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({});
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm('');
  };
  
  // Update date filters when calendar selections change
  useMemo(() => {
    if (startDate) {
      updateFilter('startDate', format(startDate, 'yyyy-MM-dd'));
    } else {
      const { startDate, ...rest } = filters;
      setFilters(rest);
    }
    
    if (endDate) {
      updateFilter('endDate', format(endDate, 'yyyy-MM-dd'));
    } else {
      const { endDate, ...rest } = filters;
      setFilters(rest);
    }
  }, [startDate, endDate]);
  
  // Update search term filter
  useMemo(() => {
    if (searchTerm) {
      updateFilter('searchTerm', searchTerm);
    } else {
      const { searchTerm, ...rest } = filters;
      setFilters(rest);
    }
  }, [searchTerm]);
  
  const expenses = filteredExpenses(filters);
  const duplicateGroups = useMemo(() => detectDuplicates(allExpenses || []), [allExpenses]);
  const duplicateExpenseIds = new Set(duplicateGroups.flatMap(group => group.expenses.map(e => e.id)));
  
  const displayExpenses = selectedTab === 'duplicates' 
    ? expenses.filter(e => duplicateExpenseIds.has(e.id))
    : expenses;
  
  const totalAmount = displayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activeFilterCount = Object.keys(filters).length;

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <div className="flex items-center gap-2">
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
        
        {showFilters && (
          <div className="bg-muted p-4 rounded-lg mb-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Filters</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CategorySelector
                  value={filters.categoryId}
                  onValueChange={(value) => updateFilter('categoryId', value)}
                  familyId={selectedFamily?.id || ''}
                />
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <label className="text-sm font-medium">Date Range</label>
                </div>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        {startDate ? format(startDate, "MMM d, yyyy") : <span>Start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        {endDate ? format(endDate, "MMM d, yyyy") : <span>End date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-accent/30 p-4 rounded-lg">
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
