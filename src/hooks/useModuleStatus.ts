import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ModuleStatus = 'active' | 'hidden' | 'coming-soon';

interface ModuleStatusRecord {
  module_id: string;
  status: ModuleStatus;
}

export function useModuleStatus() {
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all module statuses from Supabase
  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('learning_module_status')
        .select('module_id, status');

      if (fetchError) {
        console.error('Error fetching module statuses:', fetchError);
        setError(fetchError.message);
        return;
      }

      const statusMap: Record<string, ModuleStatus> = {};
      (data as ModuleStatusRecord[] || []).forEach(row => {
        statusMap[row.module_id] = row.status as ModuleStatus;
      });
      
      setStatuses(statusMap);
      setError(null);
    } catch (err) {
      console.error('Error fetching module statuses:', err);
      setError('Failed to load module statuses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load statuses on mount
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Get status for a specific module (defaults to 'active')
  const getModuleStatus = useCallback((moduleId: string): ModuleStatus => {
    return statuses[moduleId] || 'active';
  }, [statuses]);

  // Set status for a module (upsert to database)
  const setModuleStatus = useCallback(async (moduleId: string, status: ModuleStatus): Promise<boolean> => {
    try {
      // Get current user for updated_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: upsertError } = await supabase
        .from('learning_module_status')
        .upsert({
          module_id: moduleId,
          status: status,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        }, {
          onConflict: 'module_id'
        });

      if (upsertError) {
        console.error('Error saving module status:', upsertError);
        return false;
      }

      // Update local state immediately
      setStatuses(prev => ({ ...prev, [moduleId]: status }));
      return true;
    } catch (err) {
      console.error('Error setting module status:', err);
      return false;
    }
  }, []);

  // Get all statuses
  const getAllStatuses = useCallback((): Record<string, ModuleStatus> => {
    return statuses;
  }, [statuses]);

  return {
    statuses,
    loading,
    error,
    getModuleStatus,
    setModuleStatus,
    getAllStatuses,
    refetch: fetchStatuses
  };
}
