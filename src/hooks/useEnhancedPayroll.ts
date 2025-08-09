import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Employee, PayrollPeriod } from '@/types/payroll';

export interface SavedPayrollPeriod {
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
  entered_date?: string;
  paid_date?: string;
  payroll_data?: any;
  transaction_id?: string;
  notes?: string;
}

export const useEnhancedPayroll = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<SavedPayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch employees
  const fetchEmployees = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data as Employee[] || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch payroll periods
  const fetchPayrollPeriods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollPeriods(data as SavedPayrollPeriod[] || []);
    } catch (error) {
      console.error('Error fetching payroll periods:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll periods",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save payroll period
  const savePayrollPeriod = async (
    periodData: {
      name: string;
      start_date: string;
      end_date: string;
      pay_date: string;
      payroll_data: any;
      notes?: string;
      transaction_id?: string;
      entered_date?: string;
      status?: 'draft' | 'calculated' | 'processed' | 'paid';
    }
  ) => {
    if (!user) return null;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert({
          user_id: user.id,
          ...periodData,
          status: periodData.status || 'calculated'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll period saved successfully",
      });

      // Refresh the list
      await fetchPayrollPeriods();
      
      return data;
    } catch (error) {
      console.error('Error saving payroll period:', error);
      toast({
        title: "Error", 
        description: "Failed to save payroll period",
        variant: "destructive"
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Update payroll period
  const updatePayrollPeriod = async (
    periodId: string,
    updates: Partial<PayrollPeriod>
  ) => {
    if (!user) return null;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', periodId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll period updated successfully",
      });

      // Refresh the list
      await fetchPayrollPeriods();
      
      return data;
    } catch (error) {
      console.error('Error updating payroll period:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll period",
        variant: "destructive"
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Delete payroll period
  const deletePayrollPeriod = async (periodId: string) => {
    if (!user) return false;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('payroll_periods')
        .delete()
        .eq('id', periodId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll period deleted successfully",
      });

      // Refresh the list
      await fetchPayrollPeriods();
      
      return true;
    } catch (error) {
      console.error('Error deleting payroll period:', error);
      toast({
        title: "Error",
        description: "Failed to delete payroll period",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Mark payroll period as paid
  const markAsPaid = async (
    periodId: string,
    paidDate: string,
    transactionId?: string
  ) => {
    return updatePayrollPeriod(periodId, {
      status: 'paid',
      paid_date: paidDate,
      transaction_id: transactionId
    } as any);
  };

  // Load payroll period data
  const loadPayrollPeriod = async (periodId: string) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', periodId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as SavedPayrollPeriod;
    } catch (error) {
      console.error('Error loading payroll period:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll period",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initialize data when user is available
  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchPayrollPeriods();
    }
  }, [user]);

  return {
    employees,
    payrollPeriods,
    loading,
    saving,
    fetchEmployees,
    fetchPayrollPeriods,
    savePayrollPeriod,
    updatePayrollPeriod,
    deletePayrollPeriod,
    markAsPaid,
    loadPayrollPeriod,
  };
};