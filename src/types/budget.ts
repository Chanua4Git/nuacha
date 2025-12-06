export type FrequencyType = 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
export type BudgetGroupType = 'needs' | 'wants' | 'savings';

export interface IncomeSource {
  id: string;
  user_id: string;
  family_id: string;
  name: string;
  frequency: FrequencyType;
  amount_ttd: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  user_id: string;
  group_type: BudgetGroupType;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetAllocation {
  id: string;
  user_id: string;
  rule_name: string;
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetScenario {
  id: string;
  user_id: string;
  name: string;
  delta_json: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface BudgetPeriod {
  id: string;
  user_id: string;
  month: string; // First day of month
  total_income: number;
  total_expenses: number;
  surplus: number;
  rule_applied?: string;
  snapshot_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number; // Actual recorded expenses only
  totalPlannedExpenses?: number; // Planned budget from template
  byGroup: {
    needs: { total: number; percentage: number; planned?: number };
    wants: { total: number; percentage: number; planned?: number };
    savings: { total: number; percentage: number; planned?: number };
  };
  surplus: number;
  ruleComparison: {
    needs: { actual: number; target: number; variance: number };
    wants: { actual: number; target: number; variance: number };
    savings: { actual: number; target: number; variance: number };
  };
  unpaidLaborValue?: number;
}

export interface CategoryWithExpenses extends BudgetCategory {
  expenses: Array<{
    id: string;
    amount: number;
    description: string;
    date: string;
    frequency?: FrequencyType;
  }>;
  monthlyTotal: number;
}