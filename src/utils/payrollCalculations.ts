// Trinidad & Tobago Payroll Calculation Utilities

export interface TTNISRates {
  min_weekly_wage: number;
  max_weekly_wage: number;
  employee_rate: number;
  employer_rate: number;
}

// @deprecated — Use NIS earnings classes from the database instead
export const CURRENT_TT_NIS_RATES: TTNISRates = {
  min_weekly_wage: 200.00,
  max_weekly_wage: 99999.99,
  employee_rate: 0.054, // 5.4% (2026 employee portion of 16.2%)
  employer_rate: 0.108, // 10.8% (2026 employer portion of 16.2%)
};

// NIS Earnings Class shape matching the nis_earnings_classes DB table
export interface NISEarningsClass {
  earnings_class: string;
  min_weekly_earnings: number;
  max_weekly_earnings: number;
  employee_contribution: number;
  employer_contribution: number;
}

// Find the NIS class for a given weekly earnings amount
export const findNISClassForEarnings = (
  weeklyEarnings: number,
  nisClasses: NISEarningsClass[]
): NISEarningsClass | null => {
  if (!nisClasses || nisClasses.length === 0) return null;
  return nisClasses.find(cls =>
    weeklyEarnings >= cls.min_weekly_earnings &&
    weeklyEarnings <= cls.max_weekly_earnings
  ) || (weeklyEarnings > 0 ? nisClasses[nisClasses.length - 1] : null);
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
  employment_type: 'hourly' | 'monthly' | 'daily' | 'weekly' | 'shift_based' | 'contract';
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

// Calculate NIS contributions by looking up weekly earnings in the NIS classes table
// weeklyEarnings = dailyRate × daysWorked (or provided directly)
export const calculateNISByEarnings = (
  weeklyEarnings: number,
  nisClasses: NISEarningsClass[]
): { employee: number; employer: number; nisClass: string } => {
  const cls = findNISClassForEarnings(weeklyEarnings, nisClasses);
  if (!cls) return { employee: 0, employer: 0, nisClass: 'N/A' };
  return {
    employee: cls.employee_contribution,
    employer: cls.employer_contribution,
    nisClass: cls.earnings_class,
  };
};

// @deprecated — kept for backward compat; prefer calculateNISByEarnings
export const calculateNISEmployeeByDays = (daysWorked: number, dailyRate?: number, nisClasses?: NISEarningsClass[]): number => {
  if (nisClasses && nisClasses.length > 0 && dailyRate) {
    const weeklyEarnings = dailyRate * daysWorked;
    return calculateNISByEarnings(weeklyEarnings, nisClasses).employee;
  }
  // Legacy hardcoded fallback (2024 rates — should not be used)
  if (daysWorked === 3) return 37.2;
  if (daysWorked === 3.5) return 45.1;
  if (daysWorked === 4) return 53.2;
  if (daysWorked === 4.5) return 53.2;
  if (daysWorked === 5) return 61.4;
  return 0;
};

// @deprecated — kept for backward compat; prefer calculateNISByEarnings
export const calculateNISEmployerByDays = (daysWorked: number, dailyRate?: number, nisClasses?: NISEarningsClass[]): number => {
  if (nisClasses && nisClasses.length > 0 && dailyRate) {
    const weeklyEarnings = dailyRate * daysWorked;
    return calculateNISByEarnings(weeklyEarnings, nisClasses).employer;
  }
  // Legacy hardcoded fallback (2024 rates — should not be used)
  if (daysWorked === 3) return 74.4;
  if (daysWorked === 3.5) return 90.2;
  if (daysWorked === 4) return 106.4;
  if (daysWorked === 4.5) return 106.4;
  if (daysWorked === 5) return 122.8;
  return 0;
};

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

// Perform complete payroll calculation using database-driven NIS classes
export const calculatePayroll = (
  employee: EmployeeData,
  input: PayrollInput,
  ratesOrClasses?: TTNISRates | NISEarningsClass[]
): PayrollCalculationResult => {
  const gross_pay = calculateGrossPay(employee, input);
  const weekly_wage = calculateWeeklyWage(employee, input, gross_pay);
  
  let employee_contribution: number;
  let employer_contribution: number;

  // Check if NIS classes array was passed (new 2026 approach)
  const nisClasses = Array.isArray(ratesOrClasses) ? ratesOrClasses : undefined;
  const rates = !Array.isArray(ratesOrClasses) ? ratesOrClasses : undefined;

  if (nisClasses && nisClasses.length > 0) {
    // Database-driven: compute weekly earnings and find matching class
    let weeklyEarnings = weekly_wage;
    if (input.days_worked !== undefined && employee.daily_rate) {
      weeklyEarnings = employee.daily_rate * input.days_worked;
    }
    const nis = calculateNISByEarnings(weeklyEarnings, nisClasses);
    employee_contribution = nis.employee;
    employer_contribution = nis.employer;
  } else if (input.days_worked !== undefined) {
    // Legacy hardcoded fallback
    employee_contribution = calculateNISEmployeeByDays(input.days_worked);
    employer_contribution = calculateNISEmployerByDays(input.days_worked);
  } else {
    const nisContributions = calculateNISContributions(weekly_wage, rates || CURRENT_TT_NIS_RATES);
    employee_contribution = nisContributions.employee_contribution;
    employer_contribution = nisContributions.employer_contribution;
  }
  
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