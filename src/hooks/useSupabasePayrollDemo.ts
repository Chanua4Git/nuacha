import { useState, useEffect } from 'react';
import { Employee, PayrollPeriod, PayrollEntry } from '@/types/payroll';
import { calculatePayroll, EmployeeData, PayrollInput, CURRENT_TT_NIS_RATES } from '@/utils/payrollCalculations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/contexts/AuthProvider';

// Mock data for demo mode
const mockEmployees: Employee[] = [
  {
    id: 'demo-emp-1',
    user_id: 'demo-user',
    first_name: 'John',
    last_name: 'Smith',
    employee_number: 'EMP001',
    email: 'john.smith@demo.com',
    phone: '868-555-0123',
    employment_type: 'monthly',
    monthly_salary: 8000,
    hourly_rate: null,
    daily_rate: null,
    nis_number: 'NIS123456',
    is_active: true,
    date_hired: '2024-01-15',
    date_terminated: null,
    national_id: '123456789',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'demo-emp-2',
    user_id: 'demo-user',
    first_name: 'Sarah',
    last_name: 'Johnson',
    employee_number: 'EMP002',
    email: 'sarah.johnson@demo.com',
    phone: '868-555-0124',
    employment_type: 'hourly',
    monthly_salary: null,
    hourly_rate: 45,
    daily_rate: null,
    nis_number: 'NIS789012',
    is_active: true,
    date_hired: '2024-02-01',
    date_terminated: null,
    national_id: '987654321',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  },
  {
    id: 'demo-emp-3',
    user_id: 'demo-user',
    first_name: 'Michael',
    last_name: 'Williams',
    employee_number: 'EMP003',
    email: 'michael.williams@demo.com',
    phone: '868-555-0125',
    employment_type: 'daily',
    monthly_salary: null,
    hourly_rate: null,
    daily_rate: 350,
    nis_number: 'NIS345678',
    is_active: true,
    date_hired: '2024-01-30',
    date_terminated: null,
    national_id: '456789123',
    
    created_at: '2024-01-30T00:00:00Z',
    updated_at: '2024-01-30T00:00:00Z'
  }
];

const mockPayrollPeriods: PayrollPeriod[] = [
  {
    id: 'demo-period-1',
    user_id: 'demo-user',
    name: 'Demo Payroll Period - January 2024',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    pay_date: '2024-02-05',
    status: 'paid',
    total_gross_pay: 15750,
    total_nis_employee: 472.5,
    total_nis_employer: 984.375,
    total_net_pay: 15277.5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-05T00:00:00Z'
  }
];

export const useSupabasePayrollDemo = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize demo data
  useEffect(() => {
    if (!user) {
      // Demo mode - use mock data
      setEmployees(mockEmployees);
      setPayrollPeriods(mockPayrollPeriods);
      setPayrollEntries([]);
    }
  }, [user]);

  // Demo-safe functions that show notifications but don't save data
  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Demo Mode",
        description: "Sign up to save employee data permanently. This is just a preview.",
        variant: "default",
      });
      return null;
    }
    
    // If user is authenticated, this would normally save to database
    toast({
      title: "Feature Available",
      description: "Employee management is available when logged in.",
      variant: "default",
    });
    return null;
  };

  const addPayrollPeriod = async (periodData: Omit<PayrollPeriod, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'entered_date'>) => {
    if (!user) {
      toast({
        title: "Demo Mode",
        description: "Sign up to create payroll periods. This is just a preview.",
        variant: "default",
      });
      return null;
    }
    
    toast({
      title: "Feature Available",
      description: "Payroll period management is available when logged in.",
      variant: "default",
    });
    return null;
  };

  const calculateEmployeePayroll = (employee: Employee, input: PayrollInput) => {
    const employeeData: EmployeeData = {
      employment_type: employee.employment_type as 'hourly' | 'daily' | 'monthly',
      hourly_rate: employee.hourly_rate || 0,
      daily_rate: employee.daily_rate || 0,
      monthly_salary: employee.monthly_salary || 0
    };

    return calculatePayroll(employeeData, input);
  };

  const addPayrollEntry = async (payrollPeriodId: string, employee: Employee, input: PayrollInput) => {
    if (!user) {
      toast({
        title: "Demo Mode",
        description: "Sign up to save payroll calculations. This is just a preview.",
        variant: "default",
      });
      return null;
    }

    toast({
      title: "Feature Available",
      description: "Payroll entry saving is available when logged in.",
      variant: "default",
    });
    return null;
  };

  const updatePayrollPeriodTotals = async (periodId: string) => {
    if (!user) return;
    
    toast({
      title: "Feature Available",
      description: "Payroll period updates are available when logged in.",
      variant: "default",
    });
  };

  const getEntriesForPeriod = (periodId: string) => {
    return payrollEntries.filter(entry => entry.payroll_period_id === periodId);
  };

  const removeEmployee = async (employeeId: string) => {
    if (!user) {
      toast({
        title: "Demo Mode",
        description: "Sign up to manage employees. This is just a preview.",
        variant: "default",
      });
      return;
    }

    toast({
      title: "Feature Available",
      description: "Employee management is available when logged in.",
      variant: "default",
    });
  };

  const updateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
    if (!user) {
      toast({
        title: "Demo Mode",
        description: "Sign up to update employee data. This is just a preview.",
        variant: "default",
      });
      return;
    }

    toast({
      title: "Feature Available",
      description: "Employee updates are available when logged in.",
      variant: "default",
    });
  };

  return {
    employees,
    payrollPeriods,
    payrollEntries,
    loading,
    addEmployee,
    updateEmployee,
    removeEmployee,
    addPayrollPeriod,
    addPayrollEntry,
    calculateEmployeePayroll,
    updatePayrollPeriodTotals,
    getEntriesForPeriod
  };
};