import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { EmployerSettings } from '@/types/payroll';

export const useEmployerSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EmployerSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employer_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings((data as unknown as EmployerSettings) || null);
    } catch (error) {
      console.error('Error fetching employer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
};
