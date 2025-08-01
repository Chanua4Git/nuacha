import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Download, DollarSign, Calendar as CalendarIcon, FileText, Clock, Save, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, eachWeekOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/payroll';
import { calculatePayroll, formatTTCurrency, EmployeeData, PayrollInput, validatePayrollInput } from '@/utils/payrollCalculations';
import { useEnhancedPayroll } from '@/hooks/useEnhancedPayroll';
import PayrollLeadCaptureModal from './PayrollLeadCaptureModal';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface WeeklyCalculation {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  payDay: Date;
  dailyRate8Hr: number;
  recordedDaysWorked: number;
  calculatedPay: number;
  calcPayLessNIS: number;
  recordedPay: number;
  totalNISContribution: number;
  nisEmployee: number;
  nisEmployer: number;
  netPay: number;
  status: 'calculated' | 'recorded' | 'complete';
}

interface PayrollPeriodData {
  periodName: string;
  startDate: Date;
  endDate: Date;
  totalWeeks: number;
  weeks: WeeklyCalculation[];
}

interface EnhancedPayrollCalculatorProps {
  onCalculationComplete?: (employee: Employee, calculation: any, input: PayrollInput) => void;
}

export const EnhancedPayrollCalculator: React.FC<EnhancedPayrollCalculatorProps> = ({
  onCalculationComplete,
}) => {
  const { user } = useAuth();
  const { 
    employees, 
    payrollPeriods, 
    loading, 
    saving, 
    savePayrollPeriod, 
    loadPayrollPeriod,
    deletePayrollPeriod,
    markAsPaid 
  } = useEnhancedPayroll();
  
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [leadCaptureAction, setLeadCaptureAction] = useState<'save' | 'load' | 'export' | 'create_period' | 'advanced_features'>('save');
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriodData | null>(null);
  const [activeWeek, setActiveWeek] = useState<number>(0);
  const [weeklyInputs, setWeeklyInputs] = useState<Record<number, { 
    daysWorked: number;
    recordedPay: number;
    otherAllowances: number;
    otherDeductions: number;
  }>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'setup' | 'calculator' | 'summary'>('setup');
  
  // Save form state
  const [saveFormData, setSaveFormData] = useState({
    notes: '',
    transactionId: '',
    enteredDate: format(new Date(), 'yyyy-MM-dd'),
    paidDate: '',
    status: 'calculated' as 'draft' | 'calculated' | 'processed' | 'paid'
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const generatePayrollPeriod = () => {
    if (!periodStart || !periodEnd || !selectedEmployee) {
      setErrors(['Please select dates and employee']);
      return;
    }

    const weeks = eachWeekOfInterval(
      { start: periodStart, end: periodEnd },
      { weekStartsOn: 1 } // Monday start
    );

    const weeklyCalculations: WeeklyCalculation[] = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const payDay = addWeeks(weekEnd, 1); // Pay day is a week after week end
      
      // Calculate 8-hour daily rate
      let dailyRate8Hr = 0;
      if (selectedEmployee.employment_type === 'hourly' && selectedEmployee.hourly_rate) {
        dailyRate8Hr = selectedEmployee.hourly_rate * 8;
      } else if (selectedEmployee.employment_type === 'daily' && selectedEmployee.daily_rate) {
        dailyRate8Hr = selectedEmployee.daily_rate;
      } else if (selectedEmployee.employment_type === 'monthly' && selectedEmployee.monthly_salary) {
        dailyRate8Hr = (selectedEmployee.monthly_salary / 30) * (8 / 8); // Standardized to 8-hour days
      }

      return {
        weekNumber: index + 1,
        weekStart,
        weekEnd,
        payDay,
        dailyRate8Hr,
        recordedDaysWorked: 0,
        calculatedPay: 0,
        calcPayLessNIS: 0,
        recordedPay: 0,
        totalNISContribution: 0,
        nisEmployee: 0,
        nisEmployer: 0,
        netPay: 0,
        status: 'calculated' as const,
      };
    });

    const period: PayrollPeriodData = {
      periodName: `${format(periodStart, 'MMM dd')} - ${format(periodEnd, 'MMM dd, yyyy')}`,
      startDate: periodStart,
      endDate: periodEnd,
      totalWeeks: weeks.length,
      weeks: weeklyCalculations,
    };

    setPayrollPeriod(period);
    setActiveTab('calculator');
    setErrors([]);
  };

  const updateWeeklyInput = (weekIndex: number, field: string, value: number) => {
    setWeeklyInputs(prev => ({
      ...prev,
      [weekIndex]: {
        ...prev[weekIndex],
        [field]: value,
      }
    }));
  };

  const calculateWeeklyPayroll = (weekIndex: number) => {
    if (!selectedEmployee || !payrollPeriod) return;

    const week = payrollPeriod.weeks[weekIndex];
    const inputs = weeklyInputs[weekIndex] || { daysWorked: 0, recordedPay: 0, otherAllowances: 0, otherDeductions: 0 };

    const employeeData: EmployeeData = {
      employment_type: selectedEmployee.employment_type,
      hourly_rate: selectedEmployee.hourly_rate,
      monthly_salary: selectedEmployee.monthly_salary,
      daily_rate: selectedEmployee.daily_rate,
    };

    const payrollInput: PayrollInput = {
      hours_worked: inputs.daysWorked * 8, // Convert days to hours
      days_worked: inputs.daysWorked,
      other_deductions: inputs.otherDeductions,
      other_allowances: inputs.otherAllowances,
    };

    const calculation = calculatePayroll(employeeData, payrollInput);

    // Update the weekly calculation
    const updatedWeek: WeeklyCalculation = {
      ...week,
      recordedDaysWorked: inputs.daysWorked,
      calculatedPay: calculation.gross_pay,
      calcPayLessNIS: calculation.gross_pay - calculation.nis_employee_contribution,
      recordedPay: inputs.recordedPay || calculation.gross_pay,
      totalNISContribution: calculation.nis_employee_contribution + calculation.nis_employer_contribution,
      nisEmployee: calculation.nis_employee_contribution,
      nisEmployer: calculation.nis_employer_contribution,
      netPay: calculation.net_pay,
      status: 'complete',
    };

    const updatedWeeks = [...payrollPeriod.weeks];
    updatedWeeks[weekIndex] = updatedWeek;

    setPayrollPeriod({
      ...payrollPeriod,
      weeks: updatedWeeks,
    });
  };

  const exportPayrollPeriod = () => {
    if (!user) {
      setLeadCaptureAction('export');
      setLeadCaptureOpen(true);
      return;
    }

    if (!payrollPeriod || !selectedEmployee) return;

    const csvData = [
      ['Week #', 'Week Start', 'Week End', 'Pay Day', 'Pay/(8hr)dy', 'Recorded Days', 'Calculated Pay', 'NIS Employee Contribution', 'Calc Pay less NIS', 'Recorded Pay', 'NIS Employer Contribution', 'Total NIS Cont.', 'Net Pay'],
      ...payrollPeriod.weeks.map(week => [
        week.weekNumber,
        format(week.weekStart, 'dd/MM/yyyy'),
        format(week.weekEnd, 'dd/MM/yyyy'),
        format(week.payDay, 'dd/MM/yyyy'),
        formatTTCurrency(week.dailyRate8Hr),
        week.recordedDaysWorked,
        formatTTCurrency(week.calculatedPay),
        formatTTCurrency(week.nisEmployee),
        formatTTCurrency(week.calcPayLessNIS),
        formatTTCurrency(week.recordedPay),
        formatTTCurrency(week.nisEmployer),
        formatTTCurrency(week.totalNISContribution),
        formatTTCurrency(week.netPay),
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll_${selectedEmployee.employee_number}_${format(payrollPeriod.startDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalSummary = () => {
    if (!payrollPeriod) return null;

    return payrollPeriod.weeks.reduce((totals, week) => ({
      totalCalculatedPay: totals.totalCalculatedPay + week.calculatedPay,
      totalRecordedPay: totals.totalRecordedPay + week.recordedPay,
      totalNISContributions: totals.totalNISContributions + week.totalNISContribution,
      totalNetPay: totals.totalNetPay + week.netPay,
      totalDaysWorked: totals.totalDaysWorked + week.recordedDaysWorked,
    }), {
      totalCalculatedPay: 0,
      totalRecordedPay: 0,
      totalNISContributions: 0,
      totalNetPay: 0,
      totalDaysWorked: 0,
    });
  };

  const handleSavePayrollPeriod = async () => {
    if (!user) {
      setLeadCaptureAction('save');
      setLeadCaptureOpen(true);
      return;
    }

    if (!payrollPeriod || !selectedEmployee) return;

    const totals = getTotalSummary();
    if (!totals) return;

    const payrollData = {
      weeks: payrollPeriod.weeks.map(week => ({
        ...week,
        weekStart: week.weekStart.toISOString(),
        weekEnd: week.weekEnd.toISOString(),
        payDay: week.payDay.toISOString(),
      })),
      employee: selectedEmployee,
      totals
    };

    await savePayrollPeriod({
      name: payrollPeriod.periodName,
      start_date: payrollPeriod.startDate.toISOString().split('T')[0],
      end_date: payrollPeriod.endDate.toISOString().split('T')[0],
      pay_date: payrollPeriod.weeks[payrollPeriod.weeks.length - 1]?.payDay.toISOString().split('T')[0] || '',
      payroll_data: payrollData,
      notes: saveFormData.notes,
      transaction_id: saveFormData.transactionId,
      entered_date: saveFormData.enteredDate,
      status: saveFormData.status
    });
  };

  const loadExistingPeriod = async (periodId: string) => {
    if (!user) {
      setLeadCaptureAction('load');
      setLeadCaptureOpen(true);
      return;
    }

    const period = await loadPayrollPeriod(periodId);
    if (!period || !period.payroll_data) return;

    const data = period.payroll_data;
    
    // Reconstruct the payroll period from saved data
    const reconstructedPeriod: PayrollPeriodData = {
      periodName: period.name,
      startDate: new Date(period.start_date),
      endDate: new Date(period.end_date),
      totalWeeks: data.weeks.length,
      weeks: data.weeks.map((week: any) => ({
        ...week,
        weekStart: new Date(week.weekStart),
        weekEnd: new Date(week.weekEnd),
        payDay: new Date(week.payDay),
      }))
    };

    setPayrollPeriod(reconstructedPeriod);
    setSelectedEmployeeId(data.employee.id);
    setPeriodStart(new Date(period.start_date));
    setPeriodEnd(new Date(period.end_date));
    setSaveFormData({
      notes: period.notes || '',
      transactionId: period.transaction_id || '',
      enteredDate: period.entered_date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
      paidDate: period.paid_date?.split('T')[0] || '',
      status: period.status
    });
    setActiveTab('summary');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Enhanced Payroll Calculator
          </CardTitle>
          <CardDescription>
            Complete payroll management with weekly tracking and Excel-like functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup Period</TabsTrigger>
              <TabsTrigger value="calculator" disabled={!payrollPeriod}>Weekly Calculator</TabsTrigger>
              <TabsTrigger value="summary" disabled={!payrollPeriod}>Summary & Export</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Selection */}
                <div className="space-y-4">
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

                  {selectedEmployee && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Employee Details</h4>
                      <div className="space-y-1 text-sm">
                        <div>Type: {selectedEmployee.employment_type}</div>
                        <div>
                          Rate: {
                            selectedEmployee.employment_type === 'hourly' ? formatTTCurrency(selectedEmployee.hourly_rate || 0) + '/hr' :
                            selectedEmployee.employment_type === 'daily' ? formatTTCurrency(selectedEmployee.daily_rate || 0) + '/day' :
                            formatTTCurrency(selectedEmployee.monthly_salary || 0) + '/month'
                          }
                        </div>
                        <div>8-Hour Daily Rate: {formatTTCurrency(
                          selectedEmployee.employment_type === 'hourly' ? (selectedEmployee.hourly_rate || 0) * 8 :
                          selectedEmployee.employment_type === 'daily' ? selectedEmployee.daily_rate || 0 :
                          ((selectedEmployee.monthly_salary || 0) / 30)
                        )}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Period Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodStart ? format(periodStart, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={periodStart}
                          onSelect={setPeriodStart}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Period End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodEnd ? format(periodEnd, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={periodEnd}
                          onSelect={setPeriodEnd}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button 
                    onClick={generatePayrollPeriod} 
                    className="w-full"
                    disabled={!selectedEmployee || !periodStart || !periodEnd}
                  >
                    Generate Payroll Period
                  </Button>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Calculator Tab */}
            <TabsContent value="calculator" className="space-y-6">
              {payrollPeriod && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{payrollPeriod.periodName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {payrollPeriod.totalWeeks} weeks • {selectedEmployee?.first_name} {selectedEmployee?.last_name}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Weekly Tracking
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                         <TableRow>
                           <TableHead>Week #</TableHead>
                           <TableHead>Week Start</TableHead>
                           <TableHead>Week End</TableHead>
                           <TableHead>Pay Day</TableHead>
                           <TableHead>Pay/(8hr)dy</TableHead>
                           <TableHead>Days Worked</TableHead>
                           <TableHead>Calculated Pay</TableHead>
                           <TableHead>NIS Employee Contribution</TableHead>
                           <TableHead>Calc Pay less NIS</TableHead>
                           <TableHead>Recorded Pay</TableHead>
                           <TableHead>NIS Employer Contribution</TableHead>
                           <TableHead>Total NIS Cont.</TableHead>
                           <TableHead>Actions</TableHead>
                         </TableRow>
                       </TableHeader>
                      <TableBody>
                        {payrollPeriod.weeks.map((week, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">Week {week.weekNumber}</TableCell>
                            <TableCell>{format(week.weekStart, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{format(week.weekEnd, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{format(week.payDay, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{formatTTCurrency(week.dailyRate8Hr)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={weeklyInputs[index]?.daysWorked || 0}
                                onChange={(e) => updateWeeklyInput(index, 'daysWorked', Number(e.target.value))}
                                className="w-20"
                              />
                            </TableCell>
                             <TableCell className="font-medium">{formatTTCurrency(week.calculatedPay)}</TableCell>
                             <TableCell>{formatTTCurrency(week.nisEmployee)}</TableCell>
                             <TableCell>{formatTTCurrency(week.calcPayLessNIS)}</TableCell>
                             <TableCell>
                               <Input
                                 type="number"
                                 step="0.01"
                                 value={weeklyInputs[index]?.recordedPay || 0}
                                 onChange={(e) => updateWeeklyInput(index, 'recordedPay', Number(e.target.value))}
                                 className="w-24"
                               />
                             </TableCell>
                             <TableCell>{formatTTCurrency(week.nisEmployer)}</TableCell>
                             <TableCell>{formatTTCurrency(week.totalNISContribution)}</TableCell>
                             <TableCell>
                               <Button
                                 size="sm"
                                 onClick={() => calculateWeeklyPayroll(index)}
                                 disabled={!weeklyInputs[index]?.daysWorked}
                               >
                                 Calculate
                               </Button>
                             </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              {payrollPeriod && getTotalSummary() && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Days Worked</div>
                        <div className="text-2xl font-bold">{getTotalSummary()?.totalDaysWorked}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Calculated Pay</div>
                        <div className="text-2xl font-bold">{formatTTCurrency(getTotalSummary()?.totalCalculatedPay || 0)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total NIS Contributions</div>
                        <div className="text-2xl font-bold text-orange-600">{formatTTCurrency(getTotalSummary()?.totalNISContributions || 0)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Net Pay</div>
                        <div className="text-2xl font-bold text-green-600">{formatTTCurrency(getTotalSummary()?.totalNetPay || 0)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Save Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Payroll Period
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="enteredDate">Entered Date</Label>
                          <Input
                            id="enteredDate"
                            type="date"
                            value={saveFormData.enteredDate}
                            onChange={(e) => setSaveFormData(prev => ({ ...prev, enteredDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paidDate">Paid Date (Optional)</Label>
                          <Input
                            id="paidDate"
                            type="date"
                            value={saveFormData.paidDate}
                            onChange={(e) => setSaveFormData(prev => ({ ...prev, paidDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                          <Input
                            id="transactionId"
                            placeholder="Enter transaction/reference ID"
                            value={saveFormData.transactionId}
                            onChange={(e) => setSaveFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select 
                            value={saveFormData.status} 
                            onValueChange={(value) => setSaveFormData(prev => ({ ...prev, status: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="calculated">Calculated</SelectItem>
                              <SelectItem value="processed">Processed</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any additional notes..."
                          value={saveFormData.notes}
                          onChange={(e) => setSaveFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button 
                      onClick={handleSavePayrollPeriod} 
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? <AlertCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? 'Saving...' : 'Save Payroll Period'}
                    </Button>
                    <Button onClick={exportPayrollPeriod} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('setup')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      New Period
                    </Button>
                  </div>

                  {/* Load Existing Periods */}
                  {payrollPeriods.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Recent Payroll Periods
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {payrollPeriods.slice(0, 5).map((period) => (
                            <div key={period.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{period.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(period.start_date), 'MMM dd')} - {format(new Date(period.end_date), 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={
                                      period.status === 'paid' ? 'default' : 
                                      period.status === 'processed' ? 'secondary' : 
                                      'outline'
                                    }
                                  >
                                    {period.status}
                                  </Badge>
                                  {period.status === 'paid' && <CheckCircle className="h-3 w-3 text-green-600" />}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadExistingPeriod(period.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deletePayrollPeriod(period.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <PayrollLeadCaptureModal
        open={leadCaptureOpen}
        onOpenChange={setLeadCaptureOpen}
        actionType={leadCaptureAction}
      />
    </div>
  );
};