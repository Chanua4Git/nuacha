import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncomeSource } from '@/types/budget';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { toast } from 'sonner';

export function useIncomeSource(familyId?: string) {
  const { user } = useAuth();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !familyId) {
      setIncomeSources([]);
      setLoading(false);
      return;
    }

    fetchIncomeSources();
  }, [user, familyId]);

  async function fetchIncomeSources() {
    if (!familyId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('income_sources')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIncomeSources((data || []) as IncomeSource[]);

    } catch (error) {
      console.error('Error fetching income sources:', error);
      toast.error('Failed to load income sources');
    } finally {
      setLoading(false);
    }
  }

  async function createIncomeSource(sourceData: Omit<IncomeSource, 'id' | 'user_id' | 'family_id' | 'created_at' | 'updated_at'>) {
    if (!user || !familyId) return null;

    try {
      const { data, error } = await supabase
        .from('income_sources')
        .insert({
          ...sourceData,
          user_id: user.id,
          family_id: familyId
        })
        .select()
        .single();

      if (error) throw error;

      await fetchIncomeSources();
      toast.success('Income source added successfully');
      return data;

    } catch (error) {
      console.error('Error creating income source:', error);
      toast.error('Failed to add income source');
      return null;
    }
  }

  async function updateIncomeSource(id: string, updates: Partial<IncomeSource>) {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('income_sources')
        .update(updates)
        .eq('id', id)
        .eq('family_id', familyId)
        .select()
        .single();

      if (error) throw error;

      await fetchIncomeSources();
      toast.success('Income source updated successfully');
      return data;

    } catch (error) {
      console.error('Error updating income source:', error);
      toast.error('Failed to update income source');
      return null;
    }
  }

  async function deleteIncomeSource(id: string) {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('income_sources')
        .update({ is_active: false })
        .eq('id', id)
        .eq('family_id', familyId);

      if (error) throw error;

      await fetchIncomeSources();
      toast.success('Income source removed successfully');
      return true;

    } catch (error) {
      console.error('Error deleting income source:', error);
      toast.error('Failed to remove income source');
      return false;
    }
  }

  return {
    incomeSources,
    loading,
    createIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    refetch: fetchIncomeSources
  };
}