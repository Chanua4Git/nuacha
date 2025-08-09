
import { useState, useMemo } from 'react';
import { Employee, PayrollPeriod } from '@/types/payroll';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

type PeriodMode = 'existing' | 'new';

interface QuickEmployeeData {
  first_name: string;
  last_name: string;
  employment_type: 'hourly' | 'monthly' | 'daily' | 'weekly';
}

export interface PayrollLinkState {
  enabled: boolean;
  employeeId?: string;
  periodMode: PeriodMode;
  existingPeriodId?: string;
  newPeriodName?: string;
  newPeriodStart?: Date;
  newPeriodEnd?: Date;
  newPeriodPayDate?: Date;
  daysWorked?: number;
}

interface PayrollLinkSectionProps {
  state: PayrollLinkState;
  onChange: (next: PayrollLinkState) => void;

  employees: Employee[];
  payrollPeriods: PayrollPeriod[];

  // Quick add employee (uses existing hook upstream)
  onQuickAddEmployee: (data: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Employee | null>;

  // Date helpers from parent to prefill new period
  suggestedStart?: Date;
  suggestedEnd?: Date;
  suggestedPayDate?: Date;
}

const PayrollLinkSection = ({
  state,
  onChange,
  employees,
  payrollPeriods,
  onQuickAddEmployee,
  suggestedStart,
  suggestedEnd,
  suggestedPayDate
}: PayrollLinkSectionProps) => {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickEmployee, setQuickEmployee] = useState<QuickEmployeeData>({
    first_name: '',
    last_name: '',
    employment_type: 'daily'
  });
  const [quickEmpNumber, setQuickEmpNumber] = useState<string>(() => `EMP-${Date.now()}`);

  // Prefill new period defaults when enabled and mode is new
  const prefilled = useMemo(() => {
    return {
      name: state.newPeriodName ?? `Period ${new Date().toLocaleDateString()}`,
      start: state.newPeriodStart ?? suggestedStart,
      end: state.newPeriodEnd ?? suggestedEnd,
      pay: state.newPeriodPayDate ?? suggestedPayDate,
    };
  }, [state.newPeriodName, state.newPeriodStart, state.newPeriodEnd, state.newPeriodPayDate, suggestedStart, suggestedEnd, suggestedPayDate]);

  const handleEnabled = (checked: boolean) => {
    onChange({
      ...state,
      enabled: checked,
    });
  };

  const handleEmployeeSelect = (val: string) => {
    onChange({ ...state, employeeId: val });
  };

  const handlePeriodMode = (val: PeriodMode) => {
    onChange({ ...state, periodMode: val });
  };

  const handleExistingPeriod = (val: string) => {
    onChange({ ...state, existingPeriodId: val });
  };

  const handleNewPeriodField = (field: 'newPeriodName' | 'newPeriodStart' | 'newPeriodEnd' | 'newPeriodPayDate', value: string) => {
    if (field === 'newPeriodStart' || field === 'newPeriodEnd' || field === 'newPeriodPayDate') {
      onChange({ ...state, [field]: value ? new Date(value) : undefined });
    } else {
      onChange({ ...state, [field]: value });
    }
  };

  const handleDaysWorked = (val: string) => {
    const num = val ? Number(val) : undefined;
    onChange({ ...state, daysWorked: num });
  };

  const handleQuickAdd = async () => {
    if (!quickEmployee.first_name || !quickEmployee.last_name) return;

    const newEmpPayload: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      employee_number: quickEmpNumber,
      first_name: quickEmployee.first_name,
      last_name: quickEmployee.last_name,
      employment_type: quickEmployee.employment_type,
      is_active: true,
      // Optional fields left undefined (hourly_rate, monthly_salary, daily_rate, weekly_rate, contact info)
    } as any;

    const created = await onQuickAddEmployee(newEmpPayload);
    if (created?.id) {
      onChange({ ...state, employeeId: created.id });
      setQuickAddOpen(false);
    }
  };

  return (
    <Card className="border-muted">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm">Also log to Payroll</Label>
            <p className="text-xs text-muted-foreground">Tie this expense to a payroll entry.</p>
          </div>
          <Switch checked={state.enabled} onCheckedChange={handleEnabled} />
        </div>

        {state.enabled && (
          <div className="space-y-6">
            {/* Employee */}
            <div className="grid gap-2">
              <Label>Employee</Label>
              <div className="flex items-center gap-2">
                <Select value={state.employeeId} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} • {e.employment_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant={quickAddOpen ? 'secondary' : 'outline'} onClick={() => setQuickAddOpen((o) => !o)}>
                  {quickAddOpen ? 'Close' : 'Quick add'}
                </Button>
              </div>

              {quickAddOpen && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-md border p-3">
                  <div className="grid gap-1">
                    <Label htmlFor="qa_first">First name</Label>
                    <Input id="qa_first" value={quickEmployee.first_name} onChange={(e) => setQuickEmployee((s) => ({ ...s, first_name: e.target.value }))} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="qa_last">Last name</Label>
                    <Input id="qa_last" value={quickEmployee.last_name} onChange={(e) => setQuickEmployee((s) => ({ ...s, last_name: e.target.value }))} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="qa_type">Employment type</Label>
                    <Select value={quickEmployee.employment_type} onValueChange={(v: any) => setQuickEmployee((s) => ({ ...s, employment_type: v }))}>
                      <SelectTrigger id="qa_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="qa_num">Employee #</Label>
                    <Input id="qa_num" value={quickEmpNumber} onChange={(e) => setQuickEmpNumber(e.target.value)} />
                  </div>
                  <div className="col-span-full">
                    <Button type="button" onClick={handleQuickAdd} className="w-full">
                      Save employee
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Period mode */}
            <div className="grid gap-2">
              <Label>Payroll period</Label>
              <div className="flex gap-2">
                <Button type="button" variant={state.periodMode === 'existing' ? 'default' : 'outline'} onClick={() => handlePeriodMode('existing')}>
                  Use existing
                </Button>
                <Button type="button" variant={state.periodMode === 'new' ? 'default' : 'outline'} onClick={() => handlePeriodMode('new')}>
                  Create new
                </Button>
              </div>
            </div>

            {state.periodMode === 'existing' ? (
              <div className="grid gap-2">
                <Label>Select period</Label>
                <Select value={state.existingPeriodId} onValueChange={handleExistingPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a payroll period" />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollPeriods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} • {p.start_date} → {p.end_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-2">
                <div className="grid gap-1 md:col-span-2">
                  <Label htmlFor="pp_name">Name</Label>
                  <Input
                    id="pp_name"
                    value={state.newPeriodName ?? prefilled.name}
                    onChange={(e) => handleNewPeriodField('newPeriodName', e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="pp_start">Start date</Label>
                  <Input
                    id="pp_start"
                    type="date"
                    value={(state.newPeriodStart ?? prefilled.start)?.toISOString().slice(0, 10) || ''}
                    onChange={(e) => handleNewPeriodField('newPeriodStart', e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="pp_end">End date</Label>
                  <Input
                    id="pp_end"
                    type="date"
                    value={(state.newPeriodEnd ?? prefilled.end)?.toISOString().slice(0, 10) || ''}
                    onChange={(e) => handleNewPeriodField('newPeriodEnd', e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="pp_pay">Pay date</Label>
                  <Input
                    id="pp_pay"
                    type="date"
                    value={(state.newPeriodPayDate ?? prefilled.pay)?.toISOString().slice(0, 10) || ''}
                    onChange={(e) => handleNewPeriodField('newPeriodPayDate', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Days worked */}
            <div className="grid gap-1">
              <Label htmlFor="days_worked">Days worked (optional)</Label>
              <Input
                id="days_worked"
                type="number"
                min={0}
                value={state.daysWorked ?? ''}
                onChange={(e) => handleDaysWorked(e.target.value)}
                placeholder="Defaults to the number of dates selected"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollLinkSection;
