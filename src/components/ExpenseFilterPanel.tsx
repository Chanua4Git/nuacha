import React from 'react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, X, CalendarIcon, DollarSign, MapPin, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CategorySelector from './CategorySelector';
import { cn } from '@/lib/utils';

export interface ExpenseFilterValues {
  categoryIds?: string[];
  specificDate?: string;
  customStartDate?: string;
  customEndDate?: string;
  minAmount?: number;
  maxAmount?: number;
  place?: string;
  hasReceipt?: boolean;
  paymentMethod?: string;
  searchTerm?: string;
}

interface ExpenseFilterPanelProps {
  filters: ExpenseFilterValues;
  onFilterChange: (key: keyof ExpenseFilterValues, value: any) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

const ExpenseFilterPanel: React.FC<ExpenseFilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  onClose,
}) => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const last7Days = subDays(today, 7);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const handleQuickDatePreset = (preset: 'today' | 'yesterday' | 'last7days' | 'thisweek') => {
    // Clear other date filters first
    onFilterChange('customStartDate', undefined);
    onFilterChange('customEndDate', undefined);
    
    switch (preset) {
      case 'today':
        onFilterChange('specificDate', format(today, 'yyyy-MM-dd'));
        break;
      case 'yesterday':
        onFilterChange('specificDate', format(yesterday, 'yyyy-MM-dd'));
        break;
      case 'last7days':
        onFilterChange('specificDate', undefined);
        onFilterChange('customStartDate', format(last7Days, 'yyyy-MM-dd'));
        onFilterChange('customEndDate', format(today, 'yyyy-MM-dd'));
        break;
      case 'thisweek':
        onFilterChange('specificDate', undefined);
        onFilterChange('customStartDate', format(weekStart, 'yyyy-MM-dd'));
        onFilterChange('customEndDate', format(weekEnd, 'yyyy-MM-dd'));
        break;
    }
  };

  const isQuickPresetActive = (preset: 'today' | 'yesterday' | 'last7days' | 'thisweek') => {
    switch (preset) {
      case 'today':
        return filters.specificDate === format(today, 'yyyy-MM-dd');
      case 'yesterday':
        return filters.specificDate === format(yesterday, 'yyyy-MM-dd');
      case 'last7days':
        return filters.customStartDate === format(last7Days, 'yyyy-MM-dd') && 
               filters.customEndDate === format(today, 'yyyy-MM-dd');
      case 'thisweek':
        return filters.customStartDate === format(weekStart, 'yyyy-MM-dd') && 
               filters.customEndDate === format(weekEnd, 'yyyy-MM-dd');
    }
  };

  return (
    <div className="bg-muted/50 border rounded-lg p-4 mb-4 space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-foreground">Filters</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={onClearAll}
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Filters Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          Date
        </Label>
        
        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isQuickPresetActive('today') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickDatePreset('today')}
          >
            Today
          </Button>
          <Button
            variant={isQuickPresetActive('yesterday') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickDatePreset('yesterday')}
          >
            Yesterday
          </Button>
          <Button
            variant={isQuickPresetActive('last7days') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickDatePreset('last7days')}
          >
            Last 7 days
          </Button>
          <Button
            variant={isQuickPresetActive('thisweek') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickDatePreset('thisweek')}
          >
            This week
          </Button>
        </div>

        {/* Date Pickers */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Specific Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal flex-1",
                  filters.specificDate && "border-primary"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.specificDate 
                  ? format(new Date(filters.specificDate), 'PPP')
                  : 'Specific date...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.specificDate ? new Date(filters.specificDate) : undefined}
                onSelect={(date) => {
                  onFilterChange('specificDate', date ? format(date, 'yyyy-MM-dd') : undefined);
                  onFilterChange('customStartDate', undefined);
                  onFilterChange('customEndDate', undefined);
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground self-center text-sm hidden sm:block">or</span>

          {/* Date Range */}
          <div className="flex gap-2 flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    filters.customStartDate && "border-primary"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.customStartDate 
                    ? format(new Date(filters.customStartDate), 'MMM d')
                    : 'From...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.customStartDate ? new Date(filters.customStartDate) : undefined}
                  onSelect={(date) => {
                    onFilterChange('customStartDate', date ? format(date, 'yyyy-MM-dd') : undefined);
                    onFilterChange('specificDate', undefined);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    filters.customEndDate && "border-primary"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.customEndDate 
                    ? format(new Date(filters.customEndDate), 'MMM d')
                    : 'To...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.customEndDate ? new Date(filters.customEndDate) : undefined}
                  onSelect={(date) => {
                    onFilterChange('customEndDate', date ? format(date, 'yyyy-MM-dd') : undefined);
                    onFilterChange('specificDate', undefined);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Amount Filters */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Amount
        </Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Min amount"
              value={filters.minAmount ?? ''}
              onChange={(e) => onFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full"
            />
          </div>
          <span className="text-muted-foreground self-center">-</span>
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Max amount"
              value={filters.maxAmount ?? ''}
              onChange={(e) => onFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <CategorySelector
          value={filters.categoryIds?.[0]}
          onChange={(value) => onFilterChange('categoryIds', value ? [value] : undefined)}
        />
      </div>

      {/* Place/Vendor Filter */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Place / Vendor
        </Label>
        <Input
          placeholder="Search by store name..."
          value={filters.place ?? ''}
          onChange={(e) => onFilterChange('place', e.target.value || undefined)}
        />
      </div>

      {/* Additional Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Has Receipt */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasReceipt"
            checked={filters.hasReceipt ?? false}
            onCheckedChange={(checked) => onFilterChange('hasReceipt', checked ? true : undefined)}
          />
          <Label htmlFor="hasReceipt" className="flex items-center gap-1 text-sm cursor-pointer">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            Has receipt only
          </Label>
        </div>

        {/* Payment Method */}
        <div className="flex-1">
          <Select
            value={filters.paymentMethod ?? 'all'}
            onValueChange={(value) => onFilterChange('paymentMethod', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Payment method" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilterPanel;
