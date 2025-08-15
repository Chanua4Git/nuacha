import React, { createContext, useContext, useState, ReactNode } from 'react';

// Keep in sync with SAHMBudgetBuilder's data shape
export interface SAHMBudgetPreviewData {
  aboutYou: {
    name: string;
    location: string;
    householdSize: number;
    dependents: number;
    email: string;
  };
  income: {
    primaryIncome: { amount: number; frequency: string; source: string };
    secondaryIncome: { amount: number; frequency: string; source: string };
    otherIncome: { amount: number; frequency: string; source: string };
  };
  needs: Record<string, number>;
  wants: Record<string, number>;
  savings: Record<string, number>;
  notes: string;
}

interface BudgetPreviewContextValue {
  previewData: SAHMBudgetPreviewData | null;
  setPreviewData: (data: SAHMBudgetPreviewData | null) => void;
}

const BudgetPreviewContext = createContext<BudgetPreviewContextValue | undefined>(undefined);

export function BudgetPreviewProvider({ children }: { children: ReactNode }) {
  const [previewData, setPreviewData] = useState<SAHMBudgetPreviewData | null>(null);

  return (
    <BudgetPreviewContext.Provider value={{ previewData, setPreviewData }}>
      {children}
    </BudgetPreviewContext.Provider>
  );
}

export function useBudgetPreview() {
  const ctx = useContext(BudgetPreviewContext);
  if (!ctx) throw new Error('useBudgetPreview must be used within BudgetPreviewProvider');
  return ctx;
}
