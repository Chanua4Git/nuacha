import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetAllocation } from '@/types/budget';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { toast } from 'sonner';

export function useBudgetRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<BudgetAllocation[]>([]);
  const [activeRule, setActiveRule] = useState<BudgetAllocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchRules();
  }, [user]);

  async function fetchRules() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('budget_allocations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRules(data || []);
      
      // Find active rule
      const defaultRule = data?.find(rule => rule.is_default);
      setActiveRule(defaultRule || null);

    } catch (error) {
      console.error('Error fetching budget rules:', error);
      toast.error('Failed to load budget rules');
    } finally {
      setLoading(false);
    }
  }

  async function createRule(ruleData: Omit<BudgetAllocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return null;

    try {
      // If this is being set as default, unset other defaults first
      if (ruleData.is_default) {
        await supabase
          .from('budget_allocations')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('budget_allocations')
        .insert({
          ...ruleData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRules();
      toast.success('Budget rule created successfully');
      return data;

    } catch (error) {
      console.error('Error creating budget rule:', error);
      toast.error('Failed to create budget rule');
      return null;
    }
  }

  async function updateRule(id: string, updates: Partial<BudgetAllocation>) {
    if (!user) return null;

    try {
      // If this is being set as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('budget_allocations')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('budget_allocations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchRules();
      toast.success('Budget rule updated successfully');
      return data;

    } catch (error) {
      console.error('Error updating budget rule:', error);
      toast.error('Failed to update budget rule');
      return null;
    }
  }

  async function deleteRule(id: string) {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('budget_allocations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchRules();
      toast.success('Budget rule deleted successfully');
      return true;

    } catch (error) {
      console.error('Error deleting budget rule:', error);
      toast.error('Failed to delete budget rule');
      return false;
    }
  }

  return {
    rules,
    activeRule,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refetch: fetchRules
  };
}