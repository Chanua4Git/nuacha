import { useState, useEffect } from 'react';
import { Employee, PayrollPeriod, PayrollEntry } from '@/types/payroll';
import { calculatePayroll, EmployeeData, PayrollInput, NISEarningsClass } from '@/utils/payrollCalculations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Simple in-memory payroll hook until database types are available
export const useSimplePayroll = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [nisClasses, setNisClasses] = useState<NISEarningsClass[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNISClasses = async () => {
      try {
        const { data } = await (supabase as any)
          .from('nis_earnings_classes')
          .select('earnings_class, min_weekly_earnings, max_weekly_earnings, employee_contribution, employer_contribution')
          .eq('is_active', true)
          .order('min_weekly_earnings', { ascending: true });
        if (data) setNisClasses(data as NISEarningsClass[]);
      } catch (e) { console.error('Failed to fetch NIS classes:', e); }
    };
    fetchNISClasses();
  }, []);

  // Add employee
  const addEmployee = (employeeData: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: `emp_${Date.now()}`,
      user_id: 'demo_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setEmployees(prev => [...prev, newEmployee]);
    toast({
      title: "Success",
      description: "Employee added successfully",
    });
    
    return newEmployee;
  };

  // Add payroll period
  const addPayrollPeriod = (periodData: Omit<PayrollPeriod, 'id' | 'user_id' | 'total_gross_pay' | 'total_nis_employee' | 'total_nis_employer' | 'total_net_pay' | 'created_at' | 'updated_at'>) => {
    const newPeriod: PayrollPeriod = {
      ...periodData,
      id: `period_${Date.now()}`,
      user_id: 'demo_user',
      total_gross_pay: 0,
      total_nis_employee: 0,
      total_nis_employer: 0,
      total_net_pay: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setPayrollPeriods(prev => [...prev, newPeriod]);
    toast({
      title: "Success",
      description: "Payroll period created successfully",
    });
    
    return newPeriod;
  };

  // Calculate payroll for employee
  const calculateEmployeePayroll = (
    employee: Employee,
    input: PayrollInput
  ) => {
    const employeeData: EmployeeData = {
      employment_type: employee.employment_type,
      hourly_rate: employee.hourly_rate,
      monthly_salary: employee.monthly_salary,
      daily_rate: employee.daily_rate,
    };

    return calculatePayroll(employeeData, input, nisClasses.length > 0 ? nisClasses : undefined);
  };

  // Add payroll entry
  const addPayrollEntry = (
    payrollPeriodId: string,
    employee: Employee,
    input: PayrollInput
  ) => {
    const calculation = calculateEmployeePayroll(employee, input);
    
    const newEntry: PayrollEntry = {
      id: `entry_${Date.now()}`,
      payroll_period_id: payrollPeriodId,
      employee_id: employee.id,
      hours_worked: input.hours_worked || 0,
      days_worked: input.days_worked || 0,
      gross_pay: calculation.gross_pay,
      nis_employee_contribution: calculation.nis_employee_contribution,
      nis_employer_contribution: calculation.nis_employer_contribution,
      other_deductions: calculation.other_deductions,
      other_allowances: calculation.other_allowances,
      net_pay: calculation.net_pay,
      calculated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      employee,
    };

    setPayrollEntries(prev => [...prev, newEntry]);
    
    // Update payroll period totals
    updatePayrollPeriodTotals(payrollPeriodId);
    
    toast({
      title: "Success",
      description: "Payroll entry calculated successfully",
    });
    
    return newEntry;
  };

  // Update payroll period totals
  const updatePayrollPeriodTotals = (periodId: string) => {
    const periodEntries = payrollEntries.filter(entry => entry.payroll_period_id === periodId);
    
    const totals = periodEntries.reduce((acc, entry) => ({
      total_gross_pay: acc.total_gross_pay + entry.gross_pay,
      total_nis_employee: acc.total_nis_employee + entry.nis_employee_contribution,
      total_nis_employer: acc.total_nis_employer + entry.nis_employer_contribution,
      total_net_pay: acc.total_net_pay + entry.net_pay,
    }), {
      total_gross_pay: 0,
      total_nis_employee: 0,
      total_nis_employer: 0,
      total_net_pay: 0,
    });

    setPayrollPeriods(prev => 
      prev.map(period => 
        period.id === periodId 
          ? { ...period, ...totals, updated_at: new Date().toISOString() }
          : period
      )
    );
  };

  // Get entries for a specific payroll period
  const getEntriesForPeriod = (periodId: string) => {
    return payrollEntries.filter(entry => entry.payroll_period_id === periodId);
  };

  // Remove employee
  const removeEmployee = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    toast({
      title: "Success",
      description: "Employee removed successfully",
    });
  };

  // Update employee
  const updateEmployee = (employeeId: string, updates: Partial<Employee>) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, ...updates, updated_at: new Date().toISOString() }
          : emp
      )
    );
    toast({
      title: "Success",
      description: "Employee updated successfully",
    });
  };

  return {
    employees,
    payrollPeriods,
    payrollEntries,
    loading,
    addEmployee,
    addPayrollPeriod,
    addPayrollEntry,
    calculateEmployeePayroll,
    updatePayrollPeriodTotals,
    getEntriesForPeriod,
    removeEmployee,
    updateEmployee,
    nisRates: nisClasses,
  };
};