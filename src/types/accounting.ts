import { Database } from '@/integrations/supabase/types';
import { CategoryWithCamelCase } from '@/types/expense';

export type Category = Database['public']['Tables']['categories']['Row'];
export type Budget = Database['public']['Tables']['budgets']['Row'];
export type ReportTemplate = Database['public']['Tables']['report_templates']['Row'];

export type CategoryWithChildren = CategoryWithCamelCase & {
  children?: CategoryWithChildren[];
  path?: string[];
};

export type BudgetWithCategory = Budget & {
  category: Category;
};

export type MonthlyReport = {
  month: string;
  year: number;
  categories: {
    id: string;
    name: string;
    color: string;
    budget: number;
    actual: number;
    variance: number;
    percentUsed: number;
  }[];
  totals: {
    budget: number;
    actual: number;
    variance: number;
    percentUsed: number;
  };
};

export type ReportType = 'monthly' | 'yearly' | 'category' | 'comparison';

export type ReportConfig = {
  type: ReportType;
  title: string;
  filters: {
    familyIds?: string[];
    categoryIds?: string[];
    startDate?: string;
    endDate?: string;
    comparisonPeriod?: {
      startDate: string;
      endDate: string;
    };
    includeSubcategories?: boolean;
    groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
};

export interface BudgetFormData {
  familyId: string;
  categoryId: string;
  month: string;
  year: number;
  amount: number;
}

export interface CategoryFormData {
  name: string;
  color: string;
  familyId?: string;
  parentId?: string;
  budget?: number;
  description?: string;
  icon?: string;
  userId?: string;
  groupType?: 'needs' | 'wants' | 'savings';
  sortOrder?: number;
  isBudgetCategory?: boolean;
}
