import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { EmployeeShift, ShiftFormData } from '@/types/payroll';
import { toast } from 'sonner';

export const useEmployeeShifts = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchShiftsForEmployee = useCallback(async (employeeId: string): Promise<EmployeeShift[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('employee_shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data || []) as EmployeeShift[];
    } catch (error) {
      console.error('Error fetching shifts:', error);
      return [];
    }
  }, [user]);

  const fetchAllShifts = useCallback(async () => {
    if (!user) {
      setShifts([]);
      return;
    }

    setLoading(true);
    try {
      // First get user's employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (empError) throw empError;
      
      const employeeIds = (employees || []).map(e => e.id);
      
      if (employeeIds.length === 0) {
        setShifts([]);
        return;
      }

      const { data, error } = await supabase
        .from('employee_shifts')
        .select('*')
        .in('employee_id', employeeIds);

      if (error) throw error;
      setShifts((data || []) as EmployeeShift[]);
    } catch (error) {
      console.error('Error fetching all shifts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addShiftsForEmployee = async (employeeId: string, shiftsData: ShiftFormData[]): Promise<boolean> => {
    if (!user || shiftsData.length === 0) return false;

    try {
      const insertData = shiftsData.map(shift => ({
        employee_id: employeeId,
        shift_name: shift.shift_name,
        shift_hours: shift.shift_hours || null,
        base_rate: shift.base_rate,
        hourly_rate: shift.hourly_rate || null,
        is_default: shift.is_default,
      }));

      const { error } = await supabase
        .from('employee_shifts')
        .insert(insertData);

      if (error) throw error;
      
      await fetchAllShifts();
      return true;
    } catch (error) {
      console.error('Error adding shifts:', error);
      toast.error('Failed to add shifts');
      return false;
    }
  };

  const updateShiftsForEmployee = async (employeeId: string, shiftsData: ShiftFormData[]): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete existing shifts
      await supabase
        .from('employee_shifts')
        .delete()
        .eq('employee_id', employeeId);

      // Add new shifts if any
      if (shiftsData.length > 0) {
        return await addShiftsForEmployee(employeeId, shiftsData);
      }
      
      await fetchAllShifts();
      return true;
    } catch (error) {
      console.error('Error updating shifts:', error);
      toast.error('Failed to update shifts');
      return false;
    }
  };

  const deleteShift = async (shiftId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('employee_shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;
      
      await fetchAllShifts();
      toast.success('Shift deleted');
      return true;
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift');
      return false;
    }
  };

  const getShiftsForEmployee = (employeeId: string): EmployeeShift[] => {
    return shifts.filter(s => s.employee_id === employeeId);
  };

  useEffect(() => {
    if (user) {
      fetchAllShifts();
    }
  }, [user, fetchAllShifts]);

  return {
    shifts,
    loading,
    fetchShiftsForEmployee,
    fetchAllShifts,
    addShiftsForEmployee,
    updateShiftsForEmployee,
    deleteShift,
    getShiftsForEmployee,
  };
};
