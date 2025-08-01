import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useSupabasePayroll } from './useSupabasePayroll';
import { Employee, PayrollPeriod, PayrollEntry } from '@/types/payroll';
import { PayrollInput, calculatePayroll } from '@/utils/payrollCalculations';
import { toast } from 'sonner';

// LocalStorage keys
const EMPLOYEES_KEY = 'nuacha_demo_employees';
const PAYROLL_PERIODS_KEY = 'nuacha_demo_payroll_periods';
const PAYROLL_ENTRIES_KEY = 'nuacha_demo_payroll_entries';

// Demo hook for unauthenticated users using localStorage
const useLocalStoragePayroll = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedEmployees = localStorage.getItem(EMPLOYEES_KEY);
    const storedPeriods = localStorage.getItem(PAYROLL_PERIODS_KEY);
    const storedEntries = localStorage.getItem(PAYROLL_ENTRIES_KEY);

    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees));
    }
    if (storedPeriods) {
      setPayrollPeriods(JSON.parse(storedPeriods));
    }
    if (storedEntries) {
      setPayrollEntries(JSON.parse(storedEntries));
    }
  }, []);

  // Helper function to save to localStorage
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: `demo_emp_${Date.now()}`,
      user_id: 'demo_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    saveToStorage(EMPLOYEES_KEY, updatedEmployees);
    
    toast.success(`${newEmployee.first_name} ${newEmployee.last_name} added successfully!`);
    return newEmployee;
  };

  const updateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === employeeId 
        ? { ...emp, ...updates, updated_at: new Date().toISOString() }
        : emp
    );
    setEmployees(updatedEmployees);
    saveToStorage(EMPLOYEES_KEY, updatedEmployees);
    
    toast.success('Employee updated successfully!');
    return true;
  };

  const removeEmployee = async (employeeId: string) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === employeeId 
        ? { ...emp, is_active: false, updated_at: new Date().toISOString() }
        : emp
    );
    setEmployees(updatedEmployees);
    saveToStorage(EMPLOYEES_KEY, updatedEmployees);
    
    toast.success('Employee marked as inactive');
    return true;
  };

  const addPayrollPeriod = async (periodData: Omit<PayrollPeriod, 'id' | 'user_id' | 'total_gross_pay' | 'total_nis_employee' | 'total_nis_employer' | 'total_net_pay' | 'created_at' | 'updated_at'>) => {
    const newPeriod: PayrollPeriod = {
      ...periodData,
      id: `demo_period_${Date.now()}`,
      user_id: 'demo_user',
      total_gross_pay: 0,
      total_nis_employee: 0,
      total_nis_employer: 0,
      total_net_pay: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedPeriods = [...payrollPeriods, newPeriod];
    setPayrollPeriods(updatedPeriods);
    saveToStorage(PAYROLL_PERIODS_KEY, updatedPeriods);
    
    toast.success('Payroll period created successfully!');
    return newPeriod;
  };

  const calculateEmployeePayroll = (employee: Employee, input: PayrollInput) => {
    const employeeData = {
      employment_type: employee.employment_type,
      hourly_rate: employee.hourly_rate,
      monthly_salary: employee.monthly_salary,
      daily_rate: employee.daily_rate,
    };

    return calculatePayroll(employeeData, input);
  };

  const addPayrollEntry = async (payrollPeriodId: string, employee: Employee, input: PayrollInput) => {
    const calculation = calculateEmployeePayroll(employee, input);
    
    const newEntry: PayrollEntry = {
      id: `demo_entry_${Date.now()}`,
      payroll_period_id: payrollPeriodId,
      employee_id: employee.id,
      gross_pay: calculation.gross_pay,
      nis_employee_contribution: calculation.nis_employee_contribution,
      nis_employer_contribution: calculation.nis_employer_contribution,
      other_deductions: calculation.other_deductions,
      other_allowances: calculation.other_allowances,
      net_pay: calculation.net_pay,
      hours_worked: input.hours_worked,
      days_worked: input.days_worked,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      employee: employee,
    };

    const updatedEntries = [...payrollEntries, newEntry];
    setPayrollEntries(updatedEntries);
    saveToStorage(PAYROLL_ENTRIES_KEY, updatedEntries);

    // Update period totals
    await updatePayrollPeriodTotals(payrollPeriodId);
    
    toast.success('Payroll entry added successfully!');
    return newEntry;
  };

  const updatePayrollPeriodTotals = async (periodId: string) => {
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

    const updatedPeriods = payrollPeriods.map(period =>
      period.id === periodId
        ? { ...period, ...totals, updated_at: new Date().toISOString() }
        : period
    );
    
    setPayrollPeriods(updatedPeriods);
    saveToStorage(PAYROLL_PERIODS_KEY, updatedPeriods);
  };

  const getEntriesForPeriod = (periodId: string) => {
    return payrollEntries.filter(entry => entry.payroll_period_id === periodId);
  };

  // Export localStorage data for migration
  const exportLocalStorageData = () => {
    return {
      employees,
      payrollPeriods,
      payrollEntries,
    };
  };

  // Clear localStorage data
  const clearLocalStorageData = () => {
    localStorage.removeItem(EMPLOYEES_KEY);
    localStorage.removeItem(PAYROLL_PERIODS_KEY);
    localStorage.removeItem(PAYROLL_ENTRIES_KEY);
    setEmployees([]);
    setPayrollPeriods([]);
    setPayrollEntries([]);
  };

  return {
    employees: employees.filter(emp => emp.is_active !== false),
    payrollPeriods,
    payrollEntries,
    loading,
    addEmployee,
    updateEmployee,
    removeEmployee,
    addPayrollPeriod,
    addPayrollEntry,
    updatePayrollPeriodTotals,
    getEntriesForPeriod,
    calculateEmployeePayroll,
    exportLocalStorageData,
    clearLocalStorageData,
    // Lead capture states
    leadCaptureOpen: false,
    leadCaptureAction: '',
    setLeadCaptureOpen: () => {},
    setLeadCaptureAction: () => {},
  };
};

// Unified hook that switches between Supabase and localStorage based on auth
export const useUnifiedPayroll = () => {
  const { user } = useAuth();
  const supabasePayroll = useSupabasePayroll();
  const localStoragePayroll = useLocalStoragePayroll();

  if (user) {
    return {
      ...supabasePayroll,
      isDemo: false,
      exportLocalStorageData: () => null,
      clearLocalStorageData: () => {},
    };
  } else {
    return {
      ...localStoragePayroll,
      isDemo: true,
    };
  }
};