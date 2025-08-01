import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeFormData } from '@/types/payroll';

const employeeSchema = z.object({
  employee_number: z.string().min(1, 'Employee number is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  national_id: z.string().optional(),
  employment_type: z.enum(['hourly', 'monthly', 'daily']),
  hourly_rate: z.number().positive('Must be positive').optional(),
  monthly_salary: z.number().positive('Must be positive').optional(),
  daily_rate: z.number().positive('Must be positive').optional(),
  nis_number: z.string().optional(),
  date_hired: z.string().optional(),
});

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<EmployeeFormData>;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData,
  });

  const employmentType = watch('employment_type');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Employee</CardTitle>
        <CardDescription>
          Enter employee details for payroll processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  setValue('employment_type', value as 'hourly' | 'monthly' | 'daily')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
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
                {...register('hourly_rate', { valueAsNumber: true })}
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
                {...register('daily_rate', { valueAsNumber: true })}
                placeholder="200.00"
              />
              {errors.daily_rate && (
                <p className="text-sm text-destructive">
                  {errors.daily_rate.message}
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
                {...register('monthly_salary', { valueAsNumber: true })}
                placeholder="5000.00"
              />
              {errors.monthly_salary && (
                <p className="text-sm text-destructive">
                  {errors.monthly_salary.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date_hired">Date Hired</Label>
            <Input
              id="date_hired"
              type="date"
              {...register('date_hired')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Employee
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};