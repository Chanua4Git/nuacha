import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign, Clock, Calendar } from 'lucide-react';
import { Employee, EmployeeShift } from '@/types/payroll';
import { formatTTCurrency } from '@/utils/payrollCalculations';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface QuickPayEntryProps {
  employees: Employee[];
  shifts: EmployeeShift[];
  categories?: Category[];
  onRecordPayment: (data: {
    employeeId: string;
    employeeName: string;
    shiftId?: string;
    shiftName?: string;
    date: string;
    amount: number;
    hoursWorked?: number;
    notes?: string;
    categoryId?: string;
    categoryName?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export const QuickPayEntry: React.FC<QuickPayEntryProps> = ({
  employees,
  shifts,
  categories = [],
  onRecordPayment,
  loading = false,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [useHourly, setUseHourly] = useState(false);
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find default category (Elderly Care / Support) or first available
  const defaultCategory = useMemo(() => {
    const elderlyCategory = categories.find(c => 
      c.name.toLowerCase().includes('elderly') || 
      c.name.toLowerCase().includes('care') ||
      c.name.toLowerCase().includes('support')
    );
    return elderlyCategory || categories[0];
  }, [categories]);

  // Set default category when categories load
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId && defaultCategory) {
      setSelectedCategoryId(defaultCategory.id);
    }
  }, [categories, selectedCategoryId, defaultCategory]);

  const selectedCategory = useMemo(() => 
    categories.find(c => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  const employeeShifts = useMemo(() => 
    shifts.filter(s => s.employee_id === selectedEmployeeId),
    [shifts, selectedEmployeeId]
  );

  const selectedShift = useMemo(() =>
    employeeShifts.find(s => s.id === selectedShiftId),
    [employeeShifts, selectedShiftId]
  );

  // Calculate the pay amount
  const calculatedAmount = useMemo(() => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    
    if (useHourly) {
      const hours = parseFloat(hoursWorked) || 0;
      const rate = parseFloat(hourlyRate) || selectedShift?.hourly_rate || 0;
      return hours * rate;
    }

    if (selectedShift) {
      return selectedShift.base_rate;
    }

    // Fallback to employee's rate based on type
    if (selectedEmployee) {
      switch (selectedEmployee.employment_type) {
        case 'hourly':
          const hours = parseFloat(hoursWorked) || 0;
          return hours * (selectedEmployee.hourly_rate || 0);
        case 'daily':
          return selectedEmployee.daily_rate || 0;
        case 'weekly':
          return selectedEmployee.weekly_rate || 0;
        case 'monthly':
          return selectedEmployee.monthly_salary || 0;
        default:
          return 0;
      }
    }

    return 0;
  }, [customAmount, useHourly, hoursWorked, hourlyRate, selectedShift, selectedEmployee]);

  // Reset form when employee changes
  React.useEffect(() => {
    setSelectedShiftId('');
    setUseHourly(false);
    setHoursWorked('');
    setHourlyRate('');
    setCustomAmount('');
    
    // Auto-select default shift if available
    if (selectedEmployeeId) {
      const defaultShift = employeeShifts.find(s => s.is_default);
      if (defaultShift) {
        setSelectedShiftId(defaultShift.id);
      }
    }
  }, [selectedEmployeeId, employeeShifts]);

  // Update hourly rate when shift changes
  React.useEffect(() => {
    if (selectedShift?.hourly_rate) {
      setHourlyRate(selectedShift.hourly_rate.toString());
    }
  }, [selectedShift]);

  const handleSubmit = async () => {
    if (!selectedEmployeeId || calculatedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onRecordPayment({
        employeeId: selectedEmployeeId,
        employeeName: `${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`,
        shiftId: selectedShiftId || undefined,
        shiftName: selectedShift?.shift_name || undefined,
        date,
        amount: calculatedAmount,
        hoursWorked: useHourly ? parseFloat(hoursWorked) : undefined,
        notes: notes || undefined,
        categoryId: selectedCategoryId || undefined,
        categoryName: selectedCategory?.name || undefined,
      });

      // Reset form after successful submission
      setSelectedEmployeeId('');
      setSelectedShiftId('');
      setUseHourly(false);
      setHoursWorked('');
      setHourlyRate('');
      setCustomAmount('');
      setNotes('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      // Reset category to default
      if (defaultCategory) {
        setSelectedCategoryId(defaultCategory.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedEmployeeId && calculatedAmount > 0 && date;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Quick Pay Entry
        </CardTitle>
        <CardDescription>
          Record a payment and automatically create an expense entry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Employee Selection */}
        <div className="space-y-2">
          <Label>Employee *</Label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEmployeeId && (
          <>
            {/* Shift Selection (if shift-based or has shifts) */}
            {employeeShifts.length > 0 && (
              <div className="space-y-2">
                <Label>Shift Type</Label>
                <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeShifts.map(shift => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.shift_name} - {formatTTCurrency(shift.base_rate)}
                        {shift.shift_hours && ` (${shift.shift_hours})`}
                        {shift.is_default && ' ★'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hourly Toggle */}
            {(selectedShift?.hourly_rate || selectedEmployee?.employment_type === 'hourly') && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Calculate by Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Enter hours worked instead of flat rate
                  </p>
                </div>
                <Switch 
                  checked={useHourly} 
                  onCheckedChange={setUseHourly}
                />
              </div>
            )}

            {/* Hourly Input Fields */}
            {useHourly && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hours Worked
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    placeholder="8"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate (TTD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder={selectedShift?.hourly_rate?.toString() || '35.00'}
                  />
                </div>
              </div>
            )}

            {/* Custom Amount Override */}
            <div className="space-y-2">
              <Label>Custom Amount (TTD) - Optional</Label>
              <Input
                type="number"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Override calculated amount"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use shift rate or hourly calculation
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date Worked *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Category Selection */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Expense Category *</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this payment..."
                rows={2}
              />
            </div>

            {/* Calculated Amount Display */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatTTCurrency(calculatedAmount)}
                  </p>
                </div>
                <Button 
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting || loading}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This will create a payroll entry and an expense record
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
