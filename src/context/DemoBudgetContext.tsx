import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BudgetSummary, IncomeSource, BudgetCategory, BudgetAllocation, FrequencyType } from '@/types/budget';
import { toast } from 'sonner';

// Mock data
const mockIncomeSources: IncomeSource[] = [
  {
    id: '1',
    user_id: 'demo-user',
    family_id: 'demo-family',
    name: 'Primary Salary',
    frequency: 'monthly',
    amount_ttd: 8000,
    notes: 'Main job income',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'demo-user', 
    family_id: 'demo-family',
    name: 'Part-time Work',
    frequency: 'weekly',
    amount_ttd: 600,
    notes: 'Weekend consultancy',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 'demo-user',
    family_id: 'demo-family', 
    name: 'Investment Returns',
    frequency: 'yearly',
    amount_ttd: 12000,
    notes: 'Annual dividend payments',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockBudgetCategories: BudgetCategory[] = [
  // Needs categories
  { id: '1', user_id: 'demo-user', group_type: 'needs', name: 'Groceries', is_active: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', user_id: 'demo-user', group_type: 'needs', name: 'Rent/Mortgage', is_active: true, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', user_id: 'demo-user', group_type: 'needs', name: 'Utilities', is_active: true, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', user_id: 'demo-user', group_type: 'needs', name: 'Transportation', is_active: true, sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', user_id: 'demo-user', group_type: 'needs', name: 'Medical Care', is_active: true, sort_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  // Wants categories
  { id: '6', user_id: 'demo-user', group_type: 'wants', name: 'Entertainment', is_active: true, sort_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', user_id: 'demo-user', group_type: 'wants', name: 'Dining Out', is_active: true, sort_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8', user_id: 'demo-user', group_type: 'wants', name: 'Shopping', is_active: true, sort_order: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '9', user_id: 'demo-user', group_type: 'wants', name: 'Gym & Fitness', is_active: true, sort_order: 9, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  // Savings categories
  { id: '10', user_id: 'demo-user', group_type: 'savings', name: 'Emergency Fund', is_active: true, sort_order: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '11', user_id: 'demo-user', group_type: 'savings', name: 'Retirement', is_active: true, sort_order: 11, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '12', user_id: 'demo-user', group_type: 'savings', name: 'Investments', is_active: true, sort_order: 12, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const mockBudgetRules: BudgetAllocation[] = [
  {
    id: '1',
    user_id: 'demo-user',
    rule_name: '50/30/20 Rule',
    needs_pct: 50,
    wants_pct: 30,
    savings_pct: 20,
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'demo-user',
    rule_name: 'Conservative Budget',
    needs_pct: 60,
    wants_pct: 25,
    savings_pct: 15,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 'demo-user',
    rule_name: 'Aggressive Savings',
    needs_pct: 45,
    wants_pct: 25,
    savings_pct: 30,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Calculate mock summary data
const calculateMockSummary = (): BudgetSummary => {
  const totalIncome = 8000 + (600 * 4.33) + (12000 / 12); // Monthly equivalent
  const needsTotal = 3800; // 45.8% of income
  const wantsTotal = 1900; // 23.3% of income  
  const savingsTotal = 800; // 10% of income
  const totalExpenses = needsTotal + wantsTotal + savingsTotal;

  return {
    totalIncome,
    totalExpenses,
    surplus: totalIncome - totalExpenses,
    byGroup: {
      needs: { total: needsTotal, percentage: (needsTotal / totalIncome) * 100 },
      wants: { total: wantsTotal, percentage: (wantsTotal / totalIncome) * 100 },
      savings: { total: savingsTotal, percentage: (savingsTotal / totalIncome) * 100 }
    },
    ruleComparison: {
      needs: { actual: (needsTotal / totalIncome) * 100, target: 50, variance: ((needsTotal / totalIncome) * 100) - 50 },
      wants: { actual: (wantsTotal / totalIncome) * 100, target: 30, variance: ((wantsTotal / totalIncome) * 100) - 30 },
      savings: { actual: (savingsTotal / totalIncome) * 100, target: 20, variance: ((savingsTotal / totalIncome) * 100) - 20 }
    }
  };
};

interface DemoBudgetContextType {
  // Data
  incomeSources: IncomeSource[];
  budgetCategories: BudgetCategory[];
  budgetRules: BudgetAllocation[];
  budgetSummary: BudgetSummary;
  loading: boolean;
  isDemo: true;
  
  // Income management
  createIncomeSource: (data: Partial<IncomeSource>) => Promise<IncomeSource | null>;
  updateIncomeSource: (id: string, data: Partial<IncomeSource>) => Promise<IncomeSource | null>;
  deleteIncomeSource: (id: string) => Promise<boolean>;
  
  // Budget rules management  
  createRule: (data: Partial<BudgetAllocation>) => Promise<BudgetAllocation | null>;
  updateRule: (id: string, data: Partial<BudgetAllocation>) => Promise<BudgetAllocation | null>;
  deleteRule: (id: string) => Promise<boolean>;
  
  // Budget templates (mock)
  templates: any[];
  getDefaultTemplate: () => null;
  isLoading: false;
}

const DemoBudgetContext = createContext<DemoBudgetContextType | null>(null);

export const DemoBudgetProvider = ({ children }: { children: ReactNode }) => {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(mockIncomeSources);
  const [budgetCategories] = useState<BudgetCategory[]>(mockBudgetCategories);
  const [budgetRules, setBudgetRules] = useState<BudgetAllocation[]>(mockBudgetRules);
  const [budgetSummary] = useState<BudgetSummary>(calculateMockSummary());

  // Income management functions
  const createIncomeSource = async (data: Partial<IncomeSource>): Promise<IncomeSource | null> => {
    toast("Sign up to save your real income sources", {
      description: "This is just a demo. Your changes won't be saved."
    });
    
    const newSource: IncomeSource = {
      id: Date.now().toString(),
      user_id: 'demo-user',
      family_id: 'demo-family',
      name: data.name || '',
      frequency: data.frequency || 'monthly',
      amount_ttd: data.amount_ttd || 0,
      notes: data.notes || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setIncomeSources(prev => [...prev, newSource]);
    return newSource;
  };

  const updateIncomeSource = async (id: string, data: Partial<IncomeSource>): Promise<IncomeSource | null> => {
    toast("Sign up to save your real income sources", {
      description: "This is just a demo. Your changes won't be saved."
    });
    
    setIncomeSources(prev => prev.map(source => 
      source.id === id ? { ...source, ...data, updated_at: new Date().toISOString() } : source
    ));
    
    const updated = incomeSources.find(s => s.id === id);
    return updated ? { ...updated, ...data } : null;
  };

  const deleteIncomeSource = async (id: string): Promise<boolean> => {
    toast("Sign up to manage your real income sources", {
      description: "This is just a demo. Your changes won't be saved."
    });
    
    setIncomeSources(prev => prev.filter(source => source.id !== id));
    return true;
  };

  // Budget rules management
  const createRule = async (data: Partial<BudgetAllocation>): Promise<BudgetAllocation | null> => {
    toast("Sign up to create custom rules", {
      description: "This is just a demo. Your changes won't be saved."
    });
    
    const newRule: BudgetAllocation = {
      id: Date.now().toString(),
      user_id: 'demo-user',
      rule_name: data.rule_name || '',
      needs_pct: data.needs_pct || 50,
      wants_pct: data.wants_pct || 30,
      savings_pct: data.savings_pct || 20,
      is_default: data.is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setBudgetRules(prev => [...prev, newRule]);
    return newRule;
  };

  const updateRule = async (id: string, data: Partial<BudgetAllocation>): Promise<BudgetAllocation | null> => {
    toast("Sign up to manage custom rules", {
      description: "This is just a demo. Your changes won't be saved."
    });
    
    setBudgetRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...data, updated_at: new Date().toISOString() } : rule
    ));
    
    const updated = budgetRules.find(r => r.id === id);
    return updated ? { ...updated, ...data } : null;
  };

  const deleteRule = async (id: string): Promise<boolean> => {
    toast("Sign up to manage custom rules", {
      description: "This is just a demo. Your changes won't be saved."
    });
    
    setBudgetRules(prev => prev.filter(rule => rule.id !== id));
    return true;
  };

  const value: DemoBudgetContextType = {
    incomeSources,
    budgetCategories,
    budgetRules,
    budgetSummary,
    loading: false,
    isDemo: true,
    createIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    createRule,
    updateRule,
    deleteRule,
    templates: [],
    getDefaultTemplate: () => null,
    isLoading: false
  };

  return (
    <DemoBudgetContext.Provider value={value}>
      {children}
    </DemoBudgetContext.Provider>
  );
};

export const useDemoBudgetContext = () => {
  const context = useContext(DemoBudgetContext);
  if (!context) {
    throw new Error('useDemoBudgetContext must be used within a DemoBudgetProvider');
  }
  return context;
};