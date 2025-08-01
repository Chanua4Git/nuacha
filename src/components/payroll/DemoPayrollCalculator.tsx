import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertCircle } from 'lucide-react';
import { Employee } from '@/types/payroll';
import { calculatePayroll, EmployeeData, PayrollInput } from '@/utils/payrollCalculations';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DemoPayrollCalculatorProps {
  employees: Employee[];
  onSignUpPrompt: () => void;
}

export const DemoPayrollCalculator: React.FC<DemoPayrollCalculatorProps> = ({ 
  employees, 
  onSignUpPrompt 
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [daysWorked, setDaysWorked] = useState<string>('');
  const [otherAllowances, setOtherAllowances] = useState<string>('');
  const [otherDeductions, setOtherDeductions] = useState<string>('');
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const handleCalculate = () => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    try {
      const employeeData: EmployeeData = {
        employment_type: selectedEmployee.employment_type as 'hourly' | 'daily' | 'monthly',
        hourly_rate: selectedEmployee.hourly_rate || 0,
        daily_rate: selectedEmployee.daily_rate || 0,
        monthly_salary: selectedEmployee.monthly_salary || 0
      };

      const payrollInput: PayrollInput = {
        hours_worked: parseFloat(hoursWorked) || 0,
        days_worked: parseInt(daysWorked) || 0,
        other_allowances: parseFloat(otherAllowances) || 0,
        other_deductions: parseFloat(otherDeductions) || 0
      };

      const result = calculatePayroll(employeeData, payrollInput);
      setCalculationResult(result);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Calculation failed');
      setCalculationResult(null);
    }
  };

  const handleReset = () => {
    setSelectedEmployeeId('');
    setHoursWorked('');
    setDaysWorked('');
    setOtherAllowances('');
    setOtherDeductions('');
    setCalculationResult(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This is a demo calculator. Sign up to save calculations and manage payroll periods.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payroll Calculator (Demo)
          </CardTitle>
          <CardDescription>
            Calculate Trinidad & Tobago payroll with automatic NIS contributions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} - {employee.employment_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEmployee && (
            <>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedEmployee.employment_type} - Rate: {
                    selectedEmployee.employment_type === 'hourly' 
                      ? formatTTCurrency(selectedEmployee.hourly_rate || 0) + '/hr'
                      : selectedEmployee.employment_type === 'daily'
                      ? formatTTCurrency(selectedEmployee.daily_rate || 0) + '/day'
                      : formatTTCurrency(selectedEmployee.monthly_salary || 0) + '/month'
                  }
                </p>
              </div>

              {selectedEmployee.employment_type === 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours Worked</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    placeholder="Enter hours worked"
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
                    onChange={(e) => setDaysWorked(e.target.value)}
                    placeholder="Enter days worked"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allowances">Other Allowances</Label>
                  <Input
                    id="allowances"
                    type="number"
                    step="0.01"
                    value={otherAllowances}
                    onChange={(e) => setOtherAllowances(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deductions">Other Deductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    step="0.01"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCalculate} className="flex-1">
                  Calculate Payroll
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {calculationResult && (
            <div className="space-y-4">
              <h3 className="font-medium">Calculation Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Gross Pay</p>
                    <p className="text-2xl font-bold">{formatTTCurrency(calculationResult.gross_pay)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Net Pay</p>
                    <p className="text-2xl font-bold text-green-600">{formatTTCurrency(calculationResult.net_pay)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Employee NIS (3%)</p>
                    <p className="text-lg font-semibold">{formatTTCurrency(calculationResult.nis_employee_contribution)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Employer NIS (6.25%)</p>
                    <p className="text-lg font-semibold">{formatTTCurrency(calculationResult.nis_employer_contribution)}</p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This calculation is for demonstration. Sign up to save payroll records and generate reports.
                </AlertDescription>
              </Alert>

              <Button onClick={onSignUpPrompt} className="w-full" size="lg">
                Sign up to save this calculation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};