import React from 'react';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, Tag, MapPin, Receipt, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ExpenseFilterValues } from './ExpenseFilterPanel';

interface ExpenseFilterChipsProps {
  filters: ExpenseFilterValues;
  onRemoveFilter: (key: keyof ExpenseFilterValues) => void;
  categoryName?: string;
}

const ExpenseFilterChips: React.FC<ExpenseFilterChipsProps> = ({
  filters,
  onRemoveFilter,
  categoryName,
}) => {
  const chips: { key: keyof ExpenseFilterValues; icon: React.ReactNode; label: string }[] = [];

  // Specific date
  if (filters.specificDate) {
    chips.push({
      key: 'specificDate',
      icon: <Calendar className="h-3 w-3" />,
      label: format(new Date(filters.specificDate), 'MMM d, yyyy'),
    });
  }

  // Date range
  if (filters.customStartDate && filters.customEndDate && !filters.specificDate) {
    chips.push({
      key: 'customStartDate',
      icon: <Calendar className="h-3 w-3" />,
      label: `${format(new Date(filters.customStartDate), 'MMM d')} - ${format(new Date(filters.customEndDate), 'MMM d')}`,
    });
  } else if (filters.customStartDate && !filters.specificDate) {
    chips.push({
      key: 'customStartDate',
      icon: <Calendar className="h-3 w-3" />,
      label: `From ${format(new Date(filters.customStartDate), 'MMM d')}`,
    });
  } else if (filters.customEndDate && !filters.specificDate) {
    chips.push({
      key: 'customEndDate',
      icon: <Calendar className="h-3 w-3" />,
      label: `Until ${format(new Date(filters.customEndDate), 'MMM d')}`,
    });
  }

  // Amount range
  if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
    chips.push({
      key: 'minAmount',
      icon: <DollarSign className="h-3 w-3" />,
      label: `$${filters.minAmount} - $${filters.maxAmount}`,
    });
  } else if (filters.minAmount !== undefined) {
    chips.push({
      key: 'minAmount',
      icon: <DollarSign className="h-3 w-3" />,
      label: `≥ $${filters.minAmount}`,
    });
  } else if (filters.maxAmount !== undefined) {
    chips.push({
      key: 'maxAmount',
      icon: <DollarSign className="h-3 w-3" />,
      label: `≤ $${filters.maxAmount}`,
    });
  }

  // Category
  if (filters.categoryIds?.length) {
    chips.push({
      key: 'categoryIds',
      icon: <Tag className="h-3 w-3" />,
      label: categoryName || 'Category',
    });
  }

  // Place
  if (filters.place) {
    chips.push({
      key: 'place',
      icon: <MapPin className="h-3 w-3" />,
      label: filters.place,
    });
  }

  // Has receipt
  if (filters.hasReceipt) {
    chips.push({
      key: 'hasReceipt',
      icon: <Receipt className="h-3 w-3" />,
      label: 'Has receipt',
    });
  }

  // Payment method
  if (filters.paymentMethod) {
    chips.push({
      key: 'paymentMethod',
      icon: <CreditCard className="h-3 w-3" />,
      label: filters.paymentMethod.charAt(0).toUpperCase() + filters.paymentMethod.slice(1),
    });
  }

  // Search term
  if (filters.searchTerm) {
    chips.push({
      key: 'searchTerm',
      icon: null,
      label: `"${filters.searchTerm}"`,
    });
  }

  if (chips.length === 0) return null;

  const handleRemove = (key: keyof ExpenseFilterValues) => {
    // If removing date range start, also remove end
    if (key === 'customStartDate') {
      onRemoveFilter('customStartDate');
      onRemoveFilter('customEndDate');
    } else if (key === 'minAmount' && filters.maxAmount !== undefined) {
      // If removing min and max exists, remove both
      onRemoveFilter('minAmount');
      onRemoveFilter('maxAmount');
    } else {
      onRemoveFilter(key);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="flex items-center gap-1.5 pl-2 pr-1 py-1 text-xs"
        >
          {chip.icon}
          <span>{chip.label}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
            onClick={() => handleRemove(chip.key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
};

export default ExpenseFilterChips;
