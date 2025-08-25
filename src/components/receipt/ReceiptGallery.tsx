import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Calendar, DollarSign, MapPin, Eye, Grid3X3, List, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenses } from '@/hooks/useExpenses';
import { useFamilies } from '@/hooks/useFamilies';
import { useCategories } from '@/hooks/useCategories';
import { ExpenseFilters } from '@/hooks/useFilters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReceiptImageDisplay from '@/components/receipt/ReceiptImageDisplay';

interface ReceiptGalleryProps {
  filters: ExpenseFilters;
  selectedReceipts: string[];
  onSelectionChange: (selected: string[]) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'amount' | 'vendor' | 'category';

const ReceiptGallery: React.FC<ReceiptGalleryProps> = ({
  filters,
  selectedReceipts,
  onSelectionChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  
  // Convert filters for useExpenses hook
  const expenseFilters = {
    familyId: filters.familyId,
    categoryId: filters.categoryIds?.[0],
    startDate: filters.startDate,
    endDate: filters.endDate,
    place: filters.searchTerm,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    searchTerm: filters.searchTerm
  };

  const { expenses, isLoading, error } = useExpenses(expenseFilters);
  const { families } = useFamilies();
  const { categories } = useCategories();

  // Filter expenses that have receipts
  const expensesWithReceipts = expenses.filter(expense => 
    expense.receiptUrl || expense.receiptImageUrl
  );

  // Sort expenses
  const sortedExpenses = [...expensesWithReceipts].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return b.amount - a.amount;
      case 'vendor':
        return a.place.localeCompare(b.place);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const handleSelectReceipt = (expenseId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedReceipts, expenseId]);
    } else {
      onSelectionChange(selectedReceipts.filter(id => id !== expenseId));
    }
  };

  const handleSelectAll = () => {
    const allIds = sortedExpenses.map(expense => expense.id);
    if (selectedReceipts.length === allIds.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const getFamilyName = (familyId: string) => {
    const family = families.find(f => f.id === familyId);
    return family?.name || 'Unknown';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load receipts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `${sortedExpenses.length} receipts found`}
              </p>
              {sortedExpenses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedReceipts.length === sortedExpenses.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                  <SelectItem value="vendor">Sort by Vendor</SelectItem>
                  <SelectItem value="category">Sort by Category</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
            }>
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-48 w-full" />
              ))}
            </div>
          ) : sortedExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No receipts found</h3>
              <p className="text-muted-foreground">
                {Object.values(filters).some(v => v !== undefined && v !== null && v !== '') 
                  ? 'Try adjusting your filters to see more receipts.'
                  : 'Start adding expenses with receipts to see them here.'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
            }>
              {sortedExpenses.map((expense) => (
                <ReceiptCard
                  key={expense.id}
                  expense={expense}
                  viewMode={viewMode}
                  isSelected={selectedReceipts.includes(expense.id)}
                  onSelect={(checked) => handleSelectReceipt(expense.id, checked)}
                  onView={() => setSelectedExpenseId(expense.id)}
                  familyName={getFamilyName(expense.familyId)}
                  categoryName={getCategoryName(expense.category)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Detail Modal */}
      {selectedExpenseId && (
        <Dialog open={!!selectedExpenseId} onOpenChange={() => setSelectedExpenseId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receipt Details</DialogTitle>
            </DialogHeader>
            <ReceiptDetailModalContent expenseId={selectedExpenseId} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  // Inner component to access the parent scope variables
  function ReceiptDetailModalContent({ expenseId }: { expenseId: string }) {
    const expense = expensesWithReceipts.find(e => e.id === expenseId);
    
    if (!expense) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Receipt not found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Receipt Image */}
          {(expense.receiptImageUrl || expense.receiptUrl) && (
            <ReceiptImageDisplay 
              imageUrl={expense.receiptImageUrl || expense.receiptUrl} 
              description={expense.description}
            />
          )}

          {/* Expense Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{expense.description}</h3>
                <p className="text-muted-foreground">{expense.place}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Amount:</span>
                  <p>${expense.amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <p>{formatDate(expense.date)}</p>
                </div>
                <div>
                  <span className="font-medium">Family:</span>
                  <p>{getFamilyName(expense.familyId)}</p>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <p>{getCategoryName(expense.category)}</p>
                </div>
              </div>
              
              {expense.paymentMethod && (
                <div className="text-sm">
                  <span className="font-medium">Payment Method:</span>
                  <p>{expense.paymentMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
};

interface ReceiptCardProps {
  expense: any;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onView: () => void;
  familyName: string;
  categoryName: string;
  formatDate: (date: string) => string;
}

const ReceiptCard: React.FC<ReceiptCardProps> = ({
  expense,
  viewMode,
  isSelected,
  onSelect,
  onView,
  familyName,
  categoryName,
  formatDate
}) => {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelect}
              />
              
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                {expense.receiptImageUrl || expense.receiptUrl ? (
                  <img 
                    src={expense.receiptImageUrl || expense.receiptUrl} 
                    alt="Receipt thumbnail"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium truncate">{expense.description}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {expense.place}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(expense.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${expense.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onView}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {familyName}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {categoryName}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <CardContent className="p-4">
        <div className="absolute top-3 left-3 z-10">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onSelect}
            className="bg-background"
          />
        </div>

        <div className="aspect-[4/3] bg-muted rounded-lg mb-3 overflow-hidden relative">
          {expense.receiptImageUrl || expense.receiptUrl ? (
            <img 
              src={expense.receiptImageUrl || expense.receiptUrl} 
              alt="Receipt"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onView}
            className="absolute bottom-2 right-2"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm line-clamp-2">{expense.description}</h3>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{expense.place}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(expense.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>${expense.amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {familyName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {categoryName}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptGallery;