import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Download, DollarSign, Info } from 'lucide-react';
import { Employee } from '@/types/payroll';
import { calculatePayroll, formatTTCurrency, EmployeeData, PayrollInput, validatePayrollInput } from '@/utils/payrollCalculations';
import PayrollLeadCaptureModal from './PayrollLeadCaptureModal';

interface UnifiedPayrollCalculatorProps {
  employees: Employee[];
  onCalculationComplete?: (employee: Employee, calculation: any, input: PayrollInput) => void;
  isDemo?: boolean;
}

export const UnifiedPayrollCalculator: React.FC<UnifiedPayrollCalculatorProps> = ({
  employees,
  onCalculationComplete,
  isDemo = false,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [hoursWorked, setHoursWorked] = useState<number>(0);
  const [daysWorked, setDaysWorked] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);
  const [calculation, setCalculation] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Lead capture state for demo users
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadCaptureAction, setLeadCaptureAction] = useState<'save' | 'load' | 'export' | 'create_period' | 'advanced_features'>('export');

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const handleCalculate = () => {
    if (!selectedEmployee) {
      setErrors(['Please select an employee']);
      return;
    }

    const employeeData: EmployeeData = {
      employment_type: selectedEmployee.employment_type,
      hourly_rate: selectedEmployee.hourly_rate,
      monthly_salary: selectedEmployee.monthly_salary,
      daily_rate: selectedEmployee.daily_rate,
    };

    const input: PayrollInput = {
      hours_worked: hoursWorked,
      days_worked: daysWorked,
      other_deductions: otherDeductions,
      other_allowances: otherAllowances,
    };

    const validation = validatePayrollInput(employeeData, input);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    const result = calculatePayroll(employeeData, input);
    setCalculation(result);

    if (onCalculationComplete) {
      onCalculationComplete(selectedEmployee, result, input);
    }
  };

  const handleReset = () => {
    setSelectedEmployeeId('');
    setHoursWorked(0);
    setDaysWorked(0);
    setOtherDeductions(0);
    setOtherAllowances(0);
    setCalculation(null);
    setErrors([]);
  };

  const handleExport = () => {
    if (isDemo) {
      setLeadCaptureAction('export');
      setShowLeadCapture(true);
      return;
    }

    // Regular export for authenticated users
    if (!calculation || !selectedEmployee) return;

    const data = {
      employee: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
      employee_number: selectedEmployee.employee_number,
      employment_type: selectedEmployee.employment_type,
      calculation_date: new Date().toLocaleDateString(),
      gross_pay: calculation.gross_pay,
      nis_employee_contribution: calculation.nis_employee_contribution,
      nis_employer_contribution: calculation.nis_employer_contribution,
      other_deductions: calculation.other_deductions,
      other_allowances: calculation.other_allowances,
      net_pay: calculation.net_pay,
    };

    const csvContent = Object.entries(data)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll_${selectedEmployee.employee_number}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Demo Alert */}
        {isDemo && (
          <Alert className="border-accent/20 bg-accent/5">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Demo Mode:</strong> Your payroll calculations are stored temporarily in your browser.</p>
                <p className="text-sm text-muted-foreground">
                  Sign up to save your data permanently, export calculations, and access advanced features.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Trinidad & Tobago Payroll Calculator
            </CardTitle>
            <CardDescription>
              Calculate employee payroll with automatic NIS contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.employee_number} - {employee.first_name} {employee.last_name}
                      <Badge variant="secondary" className="ml-2">
                        {employee.employment_type}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <>
                {/* Employee Details */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Employee Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Type: {selectedEmployee.employment_type}</div>
                    <div>
                      Rate: {
                        selectedEmployee.employment_type === 'hourly' ? formatTTCurrency(selectedEmployee.hourly_rate || 0) + '/hr' :
                        selectedEmployee.employment_type === 'daily' ? formatTTCurrency(selectedEmployee.daily_rate || 0) + '/day' :
                        formatTTCurrency(selectedEmployee.monthly_salary || 0) + '/month'
                      }
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEmployee.employment_type === 'hourly' && (
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours Worked</Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.01"
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(Number(e.target.value))}
                        placeholder="40"
                      />
                    </div>
                  )}

                  {selectedEmployee.employment_type === 'daily' && (
                    <div className="space-y-2">
                      <Label htmlFor="days">Days Worked</Label>
                      <Input
                        id="days"
                        type="number"
                        value={daysWorked}
                        onChange={(e) => setDaysWorked(Number(e.target.value))}
                        placeholder="22"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="allowances">Other Allowances (TTD)</Label>
                    <Input
                      id="allowances"
                      type="number"
                      step="0.01"
                      value={otherAllowances}
                      onChange={(e) => setOtherAllowances(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deductions">Other Deductions (TTD)</Label>
                    <Input
                      id="deductions"
                      type="number"
                      step="0.01"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Error Messages */}
                {errors.length > 0 && (
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <p key={index} className="text-sm text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleCalculate} className="flex-1">
                    Calculate Payroll
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Calculation Results */}
        {calculation && selectedEmployee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll Calculation Results
              </CardTitle>
              <CardDescription>
                {selectedEmployee.first_name} {selectedEmployee.last_name} ({selectedEmployee.employee_number})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Gross Pay:</span>
                    <span className="font-medium">{formatTTCurrency(calculation.gross_pay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Wage (for NIS):</span>
                    <span className="font-medium">{formatTTCurrency(calculation.weekly_wage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Allowances:</span>
                    <span className="font-medium">{formatTTCurrency(calculation.other_allowances)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>NIS Employee (3%):</span>
                    <span className="font-medium text-destructive">
                      -{formatTTCurrency(calculation.nis_employee_contribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>NIS Employer (6.25%):</span>
                    <span className="font-medium text-orange-600">
                      {formatTTCurrency(calculation.nis_employer_contribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="font-medium text-destructive">
                      -{formatTTCurrency(calculation.other_deductions)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Net Pay:</span>
                <span className="text-green-600">{formatTTCurrency(calculation.net_pay)}</span>
              </div>

              <Button 
                onClick={handleExport} 
                variant="outline" 
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDemo ? 'Export Calculation (Sign up required)' : 'Export Calculation'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lead Capture Modal for demo users */}
      <PayrollLeadCaptureModal
        open={showLeadCapture}
        onOpenChange={setShowLeadCapture}
        actionType={leadCaptureAction}
      />
    </>
  );
};