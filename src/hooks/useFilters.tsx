
import { useState } from 'react';

export type ExpenseFilters = {
  familyId?: string;
  categoryIds?: string[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  place?: string;
  tags?: string[];
  isDeductible?: boolean;
  paymentMethod?: string;
  hasReceipt?: boolean;
};

export const useFilters = () => {
  const [filters, setFilters] = useState<ExpenseFilters>({});

  const updateFilter = (key: keyof ExpenseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    filters,
    updateFilter,
    clearFilters
  };
};
