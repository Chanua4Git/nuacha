
import { useMemo, useState } from 'react';
import { useExpense, ExpenseFilters } from '@/context/ExpenseContext';
import ExpenseCard from './ExpenseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Filter, X } from 'lucide-react';
import CategorySelector from './CategorySelector';
import { Badge } from '@/components/ui/badge';

const ExpenseList = () => {
  const { filteredExpenses } = useExpense();
  
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const activeFilterCount = Object.keys(filters).length;
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <div className="flex items-center">
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-[200px] mr-2"
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
          </div>
        </div>
        
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
                  onChange={(value) => updateFilter('categoryId', value)}
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
              <p className="text-2xl font-bold text-right">{expenses.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {expenses.length > 0 ? (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No expenses found</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
