// Trinidad & Tobago Payroll Calculation Utilities

export interface TTNISRates {
  min_weekly_wage: number;
  max_weekly_wage: number;
  employee_rate: number; // e.g., 0.0300 for 3%
  employer_rate: number; // e.g., 0.0625 for 6.25%
}

// Current TT NIS rates (2024)
export const CURRENT_TT_NIS_RATES: TTNISRates = {
  min_weekly_wage: 120.00,
  max_weekly_wage: 1500.00,
  employee_rate: 0.0300, // 3%
  employer_rate: 0.0625, // 6.25%
};

export interface PayrollCalculationResult {
  gross_pay: number;
  weekly_wage: number;
  nis_employee_contribution: number;
  nis_employer_contribution: number;
  net_pay: number;
  other_deductions: number;
  other_allowances: number;
}

export interface EmployeeData {
  employment_type: 'hourly' | 'monthly' | 'daily' | 'weekly';
  hourly_rate?: number;
  monthly_salary?: number;
  daily_rate?: number;
  weekly_rate?: number;
}

export interface PayrollInput {
  hours_worked?: number;
  days_worked?: number;
  other_deductions?: number;
  other_allowances?: number;
}

// Calculate NIS contributions using Excel IFS formula logic based on daily rate multipliers
export const calculateNISContributions = (
  weeklyWage: number,
  rates: TTNISRates = CURRENT_TT_NIS_RATES
): {
  employee_contribution: number;
  employer_contribution: number;
} => {
  // Convert weekly wage to daily rate (5-day work week)
  const dailyRate = weeklyWage / 5;
  
  // Calculate multiplier using Excel IFS formula equivalent
  let multiplier: number;
  
  if (dailyRate <= 24) {
    multiplier = dailyRate;
  } else if (dailyRate <= 300) {
    multiplier = 24 + (dailyRate - 24) * 0.8;
  } else {
    multiplier = 24 + 276 * 0.8; // Cap at max
  }
  
  // Convert multiplier back to weekly wage for NIS calculation
  const effectiveWeeklyWage = multiplier * 5;
  
  // Apply standard TT NIS rates to the effective weekly wage
  const employee_contribution = effectiveWeeklyWage * rates.employee_rate;
  const employer_contribution = effectiveWeeklyWage * rates.employer_rate;

  return {
    employee_contribution: Math.round(employee_contribution * 100) / 100,
    employer_contribution: Math.round(employer_contribution * 100) / 100,
  };
};

// Calculate gross pay based on employment type and inputs
export const calculateGrossPay = (
  employee: EmployeeData,
  input: PayrollInput
): number => {
  let basePay = 0;

  switch (employee.employment_type) {
    case 'hourly':
      basePay = (employee.hourly_rate || 0) * (input.hours_worked || 0);
      break;
    case 'daily':
      basePay = (employee.daily_rate || 0) * (input.days_worked || 0);
      break;
    case 'weekly':
      basePay = employee.weekly_rate || 0;
      break;
    case 'monthly':
      basePay = employee.monthly_salary || 0;
      break;
  }

  return basePay + (input.other_allowances || 0);
};

// Convert gross pay to weekly wage for NIS calculation
export const calculateWeeklyWage = (
  employee: EmployeeData,
  input: PayrollInput,
  grossPay: number
): number => {
  switch (employee.employment_type) {
    case 'hourly':
      // If hourly, assume 40-hour work week as standard
      const weeklyHours = 40;
      const hourlyRate = employee.hourly_rate || 0;
      return hourlyRate * weeklyHours;
    
    case 'daily':
      // Convert daily pay to weekly (5-day work week)
      const dailyRate = employee.daily_rate || 0;
      return dailyRate * 5;
    
    case 'weekly':
      // For weekly employees, return the weekly rate directly
      return employee.weekly_rate || 0;
    
    case 'monthly':
      // Convert monthly to weekly (4.33 weeks per month average)
      return (employee.monthly_salary || 0) / 4.33;
    
    default:
      return grossPay / 4.33; // Default weekly conversion
  }
};

// Perform complete payroll calculation
export const calculatePayroll = (
  employee: EmployeeData,
  input: PayrollInput,
  rates: TTNISRates = CURRENT_TT_NIS_RATES
): PayrollCalculationResult => {
  const gross_pay = calculateGrossPay(employee, input);
  const weekly_wage = calculateWeeklyWage(employee, input, gross_pay);
  
  const { employee_contribution, employer_contribution } = calculateNISContributions(weekly_wage, rates);
  
  const other_deductions = input.other_deductions || 0;
  const other_allowances = input.other_allowances || 0;
  
  const net_pay = gross_pay - employee_contribution - other_deductions;

  return {
    gross_pay: Math.round(gross_pay * 100) / 100,
    weekly_wage: Math.round(weekly_wage * 100) / 100,
    nis_employee_contribution: employee_contribution,
    nis_employer_contribution: employer_contribution,
    net_pay: Math.round(net_pay * 100) / 100,
    other_deductions,
    other_allowances,
  };
};

// Format currency for TT dollars
export const formatTTCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-TT', {
    style: 'currency',
    currency: 'TTD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Validate payroll input
export const validatePayrollInput = (
  employee: EmployeeData,
  input: PayrollInput
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (employee.employment_type === 'hourly') {
    if (!employee.hourly_rate || employee.hourly_rate <= 0) {
      errors.push('Hourly rate must be greater than 0');
    }
    if (!input.hours_worked || input.hours_worked <= 0) {
      errors.push('Hours worked must be greater than 0');
    }
  }

  if (employee.employment_type === 'daily') {
    if (!employee.daily_rate || employee.daily_rate <= 0) {
      errors.push('Daily rate must be greater than 0');
    }
    if (!input.days_worked || input.days_worked <= 0) {
      errors.push('Days worked must be greater than 0');
    }
  }

  if (employee.employment_type === 'weekly') {
    if (!employee.weekly_rate || employee.weekly_rate <= 0) {
      errors.push('Weekly rate must be greater than 0');
    }
  }

  if (employee.employment_type === 'monthly') {
    if (!employee.monthly_salary || employee.monthly_salary <= 0) {
      errors.push('Monthly salary must be greater than 0');
    }
  }

  if (input.other_deductions && input.other_deductions < 0) {
    errors.push('Other deductions cannot be negative');
  }

  if (input.other_allowances && input.other_allowances < 0) {
    errors.push('Other allowances cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};