export interface BudgetTemplate {
  id: string;
  user_id: string;
  family_id: string;
  name: string;
  description?: string;
  total_monthly_income: number;
  template_data: BudgetTemplateData;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetTemplateData {
  aboutYou?: {
    name?: string;
    email?: string;
    household_size?: number;
    householdSize?: number; // Legacy compatibility
    dependents?: number;
    location?: string;
  };
  income?: Record<string, number>;
  needs?: Record<string, number>;
  wants?: Record<string, number>;
  savings?: Record<string, number>;
  unpaidLabor?: Record<string, number>;
  includeUnpaidLabor?: boolean;
  notes?: string;
}

export interface BudgetComparison {
  planned: number;
  actual: number;
  variance: number;
  percentageUsed: number;
}

export interface BudgetVarianceData {
  totalIncome: BudgetComparison;
  byGroup: {
    needs: BudgetComparison;
    wants: BudgetComparison;
    savings: BudgetComparison;
  };
  byCategory: Record<string, BudgetComparison>;
  overallSurplus: BudgetComparison;
}