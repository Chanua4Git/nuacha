import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { EmployeeFormData, ShiftFormData } from '@/types/payroll';
import { ShiftEditor } from './ShiftEditor';

// Form schema that accepts strings for numeric fields
const employeeFormSchema = z.object({
  employee_number: z.string().min(1, 'Employee number is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  national_id: z.string().optional(),
  employment_type: z.enum(['hourly', 'monthly', 'daily', 'weekly', 'shift_based']),
  hourly_rate: z.string().optional(),
  monthly_salary: z.string().optional(),
  daily_rate: z.string().optional(),
  weekly_rate: z.string().optional(),
  nis_number: z.string().optional(),
  date_hired: z.string().optional(),
}).refine((data) => {
  // Validate that the appropriate rate field is provided based on employment type
  const validateRate = (rateStr: string | undefined) => {
    if (!rateStr || rateStr.trim() === '') return false;
    const rate = Number(rateStr);
    return !isNaN(rate) && rate > 0;
  };

  // shift_based doesn't need rate validation here - shifts handle that
  if (data.employment_type === 'shift_based') {
    return true;
  }

  switch (data.employment_type) {
    case 'hourly':
      return validateRate(data.hourly_rate);
    case 'monthly':
      return validateRate(data.monthly_salary);
    case 'daily':
      return validateRate(data.daily_rate);
    case 'weekly':
      return validateRate(data.weekly_rate);
    default:
      return false;
  }
}, {
  message: "Rate field is required and must be greater than 0 for the selected employment type",
  path: ["hourly_rate", "monthly_salary", "daily_rate", "weekly_rate"],
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<EmployeeFormData>;
  loading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shifts, setShifts] = useState<ShiftFormData[]>(initialData?.shifts || []);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isValid, isDirty },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      employment_type: initialData.employment_type || 'monthly',
      // Convert numeric fields to strings for consistent form handling
      hourly_rate: initialData.hourly_rate?.toString() || '',
      monthly_salary: initialData.monthly_salary?.toString() || '',
      daily_rate: initialData.daily_rate?.toString() || '',
      weekly_rate: initialData.weekly_rate?.toString() || '',
    } : {
      employee_number: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      national_id: '',
      employment_type: 'monthly',
      hourly_rate: '',
      monthly_salary: '',
      daily_rate: '',
      weekly_rate: '',
      nis_number: '',
      date_hired: '',
    },
    mode: 'onChange',
  });

  const employmentType = watch('employment_type');
  const isEditMode = Boolean(initialData);

  const handleFormSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    clearErrors();
    
    // Validate shifts for shift_based employees
    if (data.employment_type === 'shift_based' && shifts.length === 0) {
      setError('root', { message: 'At least one shift configuration is required for shift-based employees' });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Ensure numeric fields are properly converted
      const processedData: EmployeeFormData = {
        employee_number: data.employee_number,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        national_id: data.national_id || undefined,
        employment_type: data.employment_type,
        hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
        monthly_salary: data.monthly_salary ? Number(data.monthly_salary) : undefined,
        daily_rate: data.daily_rate ? Number(data.daily_rate) : undefined,
        weekly_rate: data.weekly_rate ? Number(data.weekly_rate) : undefined,
        nis_number: data.nis_number || undefined,
        date_hired: data.date_hired || undefined,
        shifts: data.employment_type === 'shift_based' ? shifts : undefined,
      };

      await onSubmit(processedData);
    } catch (error) {
      setError('root', { 
        message: error instanceof Error ? error.message : 'Failed to save employee' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Employee' : 'Add Employee'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update employee details for payroll processing'
            : 'Enter employee details for payroll processing'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_number">Employee Number *</Label>
              <Input
                id="employee_number"
                {...register('employee_number')}
                placeholder="EMP001"
              />
              {errors.employee_number && (
                <p className="text-sm text-destructive">
                  {errors.employee_number.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type *</Label>
              <Select
                value={employmentType}
                onValueChange={(value) => 
                  setValue('employment_type', value as 'hourly' | 'monthly' | 'daily' | 'weekly')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="shift_based">Shift-Based (Multiple Rates)</SelectItem>
                </SelectContent>
              </Select>
              {errors.employment_type && (
                <p className="text-sm text-destructive">
                  {errors.employment_type.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="John"
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+1 868 123 4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="national_id">National ID</Label>
              <Input
                id="national_id"
                {...register('national_id')}
                placeholder="12345678901"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nis_number">NIS Number</Label>
              <Input
                id="nis_number"
                {...register('nis_number')}
                placeholder="NIS123456"
              />
            </div>
          </div>

          {/* Employment Type Specific Fields */}
          {employmentType === 'hourly' && (
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (TTD) *</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                {...register('hourly_rate')}
                placeholder="25.00"
              />
              {errors.hourly_rate && (
                <p className="text-sm text-destructive">
                  {errors.hourly_rate.message}
                </p>
              )}
            </div>
          )}

          {employmentType === 'daily' && (
            <div className="space-y-2">
              <Label htmlFor="daily_rate">Daily Rate (TTD) *</Label>
              <Input
                id="daily_rate"
                type="number"
                step="0.01"
                {...register('daily_rate')}
                placeholder="200.00"
              />
              {errors.daily_rate && (
                <p className="text-sm text-destructive">
                  {errors.daily_rate.message}
                </p>
              )}
            </div>
          )}

          {employmentType === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="weekly_rate">Weekly Rate (TTD) *</Label>
              <Input
                id="weekly_rate"
                type="number"
                step="0.01"
                {...register('weekly_rate')}
                placeholder="1000.00"
              />
              {errors.weekly_rate && (
                <p className="text-sm text-destructive">
                  {errors.weekly_rate.message}
                </p>
              )}
            </div>
          )}

          {employmentType === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="monthly_salary">Monthly Salary (TTD) *</Label>
              <Input
                id="monthly_salary"
                type="number"
                step="0.01"
                {...register('monthly_salary')}
                placeholder="5000.00"
              />
              {errors.monthly_salary && (
                <p className="text-sm text-destructive">
                  {errors.monthly_salary.message}
                </p>
              )}
            </div>
          )}

          {/* Shift Editor for shift-based employees */}
          {employmentType === 'shift_based' && (
            <ShiftEditor shifts={shifts} onChange={setShifts} />
          )}

          <div className="space-y-2">
            <Label htmlFor="date_hired">Date Hired</Label>
            <Input
              id="date_hired"
              type="date"
              {...register('date_hired')}
            />
          </div>

          {errors.root && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {errors.root.message}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || loading}
            >
              {(isSubmitting || loading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEditMode ? 'Update Employee' : 'Add Employee'
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="flex-1"
                disabled={isSubmitting || loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};