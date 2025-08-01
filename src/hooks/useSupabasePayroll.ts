import { useState, useEffect } from 'react';
import { Employee, PayrollPeriod, PayrollEntry } from '@/types/payroll';
import { calculatePayroll, EmployeeData, PayrollInput, CURRENT_TT_NIS_RATES } from '@/utils/payrollCalculations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';

export const useSupabasePayroll = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch employees
  const fetchEmployees = async () => {
    if (!user) {
      setEmployees([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees((data as unknown as Employee[]) || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch payroll periods
  const fetchPayrollPeriods = async () => {
    if (!user) {
      setPayrollPeriods([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_periods' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollPeriods((data as unknown as PayrollPeriod[]) || []);
    } catch (error) {
      console.error('Error fetching payroll periods:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll periods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch payroll entries
  const fetchPayrollEntries = async () => {
    if (!user) {
      setPayrollEntries([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_entries' as any)
        .select(`
          *,
          employee:employees(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollEntries((data as unknown as PayrollEntry[]) || []);
    } catch (error) {
      console.error('Error fetching payroll entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add employee
  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add employees",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees' as any)
        .insert([{
          ...employeeData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchEmployees();
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      
      return data as unknown as Employee;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add payroll period
  const addPayrollPeriod = async (periodData: Omit<PayrollPeriod, 'id' | 'user_id' | 'total_gross_pay' | 'total_nis_employee' | 'total_nis_employer' | 'total_net_pay' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create payroll periods",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_periods' as any)
        .insert([{
          ...periodData,
          user_id: user.id,
          total_gross_pay: 0,
          total_nis_employee: 0,
          total_nis_employer: 0,
          total_net_pay: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchPayrollPeriods();
      toast({
        title: "Success",
        description: "Payroll period created successfully",
      });
      
      return data as unknown as PayrollPeriod;
    } catch (error) {
      console.error('Error adding payroll period:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll period",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
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

    return calculatePayroll(employeeData, input, CURRENT_TT_NIS_RATES);
  };

  // Add payroll entry
  const addPayrollEntry = async (
    payrollPeriodId: string,
    employee: Employee,
    input: PayrollInput
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to calculate payroll",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const calculation = calculateEmployeePayroll(employee, input);
      
      const { data, error } = await supabase
        .from('payroll_entries' as any)
        .insert([{
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
        }])
        .select(`
          *,
          employee:employees(*)
        `)
        .single();

      if (error) throw error;

      await fetchPayrollEntries();
      await updatePayrollPeriodTotals(payrollPeriodId);
      
      toast({
        title: "Success",
        description: "Payroll entry calculated successfully",
      });
      
      return data as unknown as PayrollEntry;
    } catch (error) {
      console.error('Error adding payroll entry:', error);
      toast({
        title: "Error",
        description: "Failed to calculate payroll entry",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update payroll period totals
  const updatePayrollPeriodTotals = async (periodId: string) => {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('payroll_entries' as any)
        .select('*')
        .eq('payroll_period_id', periodId);

      if (entriesError) throw entriesError;

      const totals = (entries as unknown as any[]).reduce((acc, entry) => ({
        total_gross_pay: acc.total_gross_pay + Number(entry.gross_pay),
        total_nis_employee: acc.total_nis_employee + Number(entry.nis_employee_contribution),
        total_nis_employer: acc.total_nis_employer + Number(entry.nis_employer_contribution),
        total_net_pay: acc.total_net_pay + Number(entry.net_pay),
      }), {
        total_gross_pay: 0,
        total_nis_employee: 0,
        total_nis_employer: 0,
        total_net_pay: 0,
      });

      const { error: updateError } = await supabase
        .from('payroll_periods' as any)
        .update(totals)
        .eq('id', periodId);

      if (updateError) throw updateError;

      await fetchPayrollPeriods();
    } catch (error) {
      console.error('Error updating payroll period totals:', error);
    }
  };

  // Get entries for a specific payroll period
  const getEntriesForPeriod = (periodId: string) => {
    return payrollEntries.filter(entry => entry.payroll_period_id === periodId);
  };

  // Remove employee
  const removeEmployee = async (employeeId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees' as any)
        .update({ is_active: false })
        .eq('id', employeeId);

      if (error) throw error;

      await fetchEmployees();
      toast({
        title: "Success",
        description: "Employee removed successfully",
      });
    } catch (error) {
      console.error('Error removing employee:', error);
      toast({
        title: "Error",
        description: "Failed to remove employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update employee
  const updateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees' as any)
        .update(updates)
        .eq('id', employeeId);

      if (error) throw error;

      await fetchEmployees();
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchPayrollPeriods();
      fetchPayrollEntries();
    }
  }, [user]);

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
    fetchEmployees,
    fetchPayrollPeriods,
    fetchPayrollEntries,
    nisRates: [CURRENT_TT_NIS_RATES],
  };
};