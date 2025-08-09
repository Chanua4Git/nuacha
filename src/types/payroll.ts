// Trinidad & Tobago Payroll System Types

export interface Employee {
  id: string;
  user_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  national_id?: string; // TT National ID
  employment_type: 'hourly' | 'monthly' | 'daily' | 'weekly';
  hourly_rate?: number;
  monthly_salary?: number;
  daily_rate?: number;
  weekly_rate?: number;
  nis_number?: string; // National Insurance Scheme number
  is_active: boolean;
  date_hired?: string;
  date_terminated?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollPeriod {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  status: 'draft' | 'calculated' | 'processed' | 'paid';
  total_gross_pay: number;
  total_nis_employee: number;
  total_nis_employer: number;
  total_net_pay: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollEntry {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  hours_worked: number;
  days_worked: number;
  gross_pay: number;
  nis_employee_contribution: number;
  nis_employer_contribution: number;
  other_deductions: number;
  other_allowances: number;
  net_pay: number;
  calculated_at?: string;
  created_at?: string;
  updated_at?: string;
  employee?: Employee; // For joined queries
}

export interface NISRate {
  id: string;
  effective_date: string;
  min_weekly_wage: number;
  max_weekly_wage: number;
  employee_rate: number; // e.g., 0.0300 for 3%
  employer_rate: number; // e.g., 0.0625 for 6.25%
  is_active: boolean;
  created_at?: string;
}

// For payroll calculations
export interface PayrollCalculation {
  employee_id: string;
  gross_pay: number;
  weekly_wage: number;
  nis_employee_contribution: number;
  nis_employer_contribution: number;
  net_pay: number;
  hours_worked?: number;
  days_worked?: number;
}

// For export functionality
export interface PayrollExportData {
  payroll_period: PayrollPeriod;
  entries: (PayrollEntry & { employee: Employee })[];
  totals: {
    total_gross_pay: number;
    total_nis_employee: number;
    total_nis_employer: number;
    total_net_pay: number;
    total_employees: number;
  };
}

// For form inputs
export interface EmployeeFormData {
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  employment_type: 'hourly' | 'monthly' | 'daily' | 'weekly';
  hourly_rate?: number;
  monthly_salary?: number;
  daily_rate?: number;
  weekly_rate?: number;
  nis_number?: string;
  date_hired?: string;
}

export interface PayrollPeriodFormData {
  name: string;
  start_date: string;
  end_date: string;
  pay_date: string;
}

export interface PayrollEntryFormData {
  employee_id: string;
  hours_worked?: number;
  days_worked?: number;
  other_deductions?: number;
  other_allowances?: number;
}