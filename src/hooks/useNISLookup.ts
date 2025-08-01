// Hook for managing NIS earnings classes and lookup calculations
import { useState, useEffect } from 'react';
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

export const useNISLookup = () => {
  const [nisClasses, setNisClasses] = useState<NISEarningsClass[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch active NIS earnings classes using RPC
  const fetchNISClasses = async (effectiveDate?: string) => {
    setLoading(true);
    try {
      const targetDate = effectiveDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await (supabase as any).rpc('get_nis_earnings_classes', {
        target_date: targetDate
      });

      if (error) {
        console.error('Error fetching NIS classes:', error);
        return [];
      }

      const classes = (data || []) as NISEarningsClass[];
      setNisClasses(classes);
      return classes;
    } catch (error) {
      console.error('Error in fetchNISClasses:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Find appropriate NIS class for weekly earnings
  const findNISClass = (weeklyEarnings: number, classes?: NISEarningsClass[]): NISEarningsClass | null => {
    const activeClasses = classes || nisClasses;
    return activeClasses.find(cls => 
      weeklyEarnings >= cls.min_weekly_earnings && 
      weeklyEarnings <= cls.max_weekly_earnings
    ) || null;
  };

  // Calculate NIS contributions using lookup table
  const calculateNISContributions = async (weeklyEarnings: number, effectiveDate?: string) => {
    let activeClasses = nisClasses;
    
    if (activeClasses.length === 0 || effectiveDate) {
      activeClasses = await fetchNISClasses(effectiveDate);
    }

    const nisClass = findNISClass(weeklyEarnings, activeClasses);

    if (!nisClass) {
      // Fallback to highest class if earnings exceed maximum
      const highestClass = activeClasses[activeClasses.length - 1];
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

  // Calculate complete payroll with lookup
  const calculatePayrollWithLookup = async (
    grossPay: number,
    weeklyEarnings: number,
    otherDeductions: number = 0,
    otherAllowances: number = 0,
    effectiveDate?: string
  ): Promise<PayrollCalculationResult> => {
    const { nis_class, employee_contribution, employer_contribution } = 
      await calculateNISContributions(weeklyEarnings, effectiveDate);

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

  // Calculate weekly earnings from different pay structures
  const calculateWeeklyEarnings = (
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
        weeklyBase = rate / 4.33; // Average weeks per month
        break;
    }

    return weeklyBase;
  };

  useEffect(() => {
    fetchNISClasses();
  }, []);

  return {
    nisClasses,
    loading,
    fetchNISClasses,
    findNISClass,
    calculateNISContributions,
    calculatePayrollWithLookup,
    calculateWeeklyEarnings,
  };
};