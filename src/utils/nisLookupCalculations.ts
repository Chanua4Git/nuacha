// Trinidad & Tobago NIS Lookup-based Payroll Calculations

import { supabase } from '@/integrations/supabase/client';

export interface NISEarningsClass {
  id: string;
  effective_date: string;
  earnings_class: string;
  min_weekly_earnings: number;
  max_weekly_earnings: number;
  employee_contribution: number;
  employer_contribution: number;
  is_active: boolean;
}

export interface PayrollCalculationResult {
  gross_pay: number;
  weekly_earnings: number;
  nis_class: string;
  nis_employee_contribution: number;
  nis_employer_contribution: number;
  net_pay: number;
  other_deductions: number;
  other_allowances: number;
  calculation_method: 'lookup_table' | 'percentage';
}

export interface PayrollCalculationHistory {
  id: string;
  employee_id: string;
  calculation_date: string;
  weekly_earnings: number;
  nis_class: string;
  employee_contribution: number;
  employer_contribution: number;
  calculation_method: string;
  notes?: string;
}

// Fetch active NIS earnings classes for a specific date
export const fetchNISEarningsClasses = async (effectiveDate?: string): Promise<NISEarningsClass[]> => {
  const targetDate = effectiveDate || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('nis_earnings_classes')
    .select('*')
    .eq('is_active', true)
    .lte('effective_date', targetDate)
    .order('effective_date', { ascending: false })
    .order('min_weekly_earnings', { ascending: true });

  if (error) {
    console.error('Error fetching NIS earnings classes:', error);
    return [];
  }

  // Group by earnings class and take the most recent effective date for each
  const latestClasses = new Map<string, NISEarningsClass>();
  
  data?.forEach(cls => {
    const existing = latestClasses.get(cls.earnings_class);
    if (!existing || cls.effective_date > existing.effective_date) {
      latestClasses.set(cls.earnings_class, cls);
    }
  });

  return Array.from(latestClasses.values()).sort((a, b) => 
    a.min_weekly_earnings - b.min_weekly_earnings
  );
};

// Find the appropriate NIS class for weekly earnings
export const findNISClass = (
  weeklyEarnings: number,
  nisClasses: NISEarningsClass[]
): NISEarningsClass | null => {
  return nisClasses.find(cls => 
    weeklyEarnings >= cls.min_weekly_earnings && 
    weeklyEarnings <= cls.max_weekly_earnings
  ) || null;
};

// Calculate NIS contributions using lookup table
export const calculateNISContributionsLookup = async (
  weeklyEarnings: number,
  effectiveDate?: string
): Promise<{
  nis_class: string;
  employee_contribution: number;
  employer_contribution: number;
}> => {
  const nisClasses = await fetchNISEarningsClasses(effectiveDate);
  const nisClass = findNISClass(weeklyEarnings, nisClasses);

  if (!nisClass) {
    // Fallback to highest class if earnings exceed maximum
    const highestClass = nisClasses[nisClasses.length - 1];
    return {
      nis_class: highestClass?.earnings_class || 'Class 10',
      employee_contribution: highestClass?.employee_contribution || 0,
      employer_contribution: highestClass?.employer_contribution || 0,
    };
  }

  return {
    nis_class: nisClass.earnings_class,
    employee_contribution: nisClass.employee_contribution,
    employer_contribution: nisClass.employer_contribution,
  };
};

// Enhanced payroll calculation with lookup table support
export const calculatePayrollWithLookup = async (
  grossPay: number,
  weeklyEarnings: number,
  otherDeductions: number = 0,
  otherAllowances: number = 0,
  effectiveDate?: string
): Promise<PayrollCalculationResult> => {
  const { nis_class, employee_contribution, employer_contribution } = 
    await calculateNISContributionsLookup(weeklyEarnings, effectiveDate);

  const net_pay = grossPay - employee_contribution - otherDeductions;

  return {
    gross_pay: Math.round(grossPay * 100) / 100,
    weekly_earnings: Math.round(weeklyEarnings * 100) / 100,
    nis_class,
    nis_employee_contribution: employee_contribution,
    nis_employer_contribution: employer_contribution,
    net_pay: Math.round(net_pay * 100) / 100,
    other_deductions: otherDeductions,
    other_allowances: otherAllowances,
    calculation_method: 'lookup_table',
  };
};

// Save payroll calculation to history
export const savePayrollCalculation = async (
  employeeId: string,
  calculation: PayrollCalculationResult,
  calculationDate: string,
  notes?: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('payroll_calculations')
    .insert({
      user_id: user.id,
      employee_id: employeeId,
      calculation_date: calculationDate,
      weekly_earnings: calculation.weekly_earnings,
      nis_class: calculation.nis_class,
      employee_contribution: calculation.nis_employee_contribution,
      employer_contribution: calculation.nis_employer_contribution,
      calculation_method: calculation.calculation_method,
      notes,
    });

  if (error) {
    console.error('Error saving payroll calculation:', error);
    throw error;
  }
};

// Fetch payroll calculation history for an employee
export const fetchPayrollHistory = async (
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<PayrollCalculationHistory[]> => {
  let query = supabase
    .from('payroll_calculations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('calculation_date', { ascending: false });

  if (startDate) {
    query = query.gte('calculation_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('calculation_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching payroll history:', error);
    return [];
  }

  return data || [];
};

// Calculate weekly earnings from different pay structures
export const calculateWeeklyEarnings = (
  employmentType: 'hourly' | 'daily' | 'monthly',
  rate: number,
  hoursOrDays?: number,
  paySchedule: 'weekly' | 'bi-weekly' | 'monthly' = 'weekly'
): number => {
  let weeklyBase = 0;

  switch (employmentType) {
    case 'hourly':
      const weeklyHours = hoursOrDays || 40;
      weeklyBase = rate * weeklyHours;
      break;
    case 'daily':
      const weeklyDays = hoursOrDays || 5;
      weeklyBase = rate * weeklyDays;
      break;
    case 'monthly':
      // Convert monthly to weekly
      weeklyBase = rate / 4.33; // Average weeks per month
      break;
  }

  // Adjust based on pay schedule
  switch (paySchedule) {
    case 'bi-weekly':
      return weeklyBase; // Already weekly
    case 'monthly':
      return weeklyBase; // Already converted to weekly
    default:
      return weeklyBase;
  }
};

// Format TT currency
export const formatTTCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-TT', {
    style: 'currency',
    currency: 'TTD',
    minimumFractionDigits: 2,
  }).format(amount);
};