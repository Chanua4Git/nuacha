
import { useState } from 'react';
import { ExpenseFilters } from '../context/ExpenseContext';

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
