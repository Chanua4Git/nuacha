import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import type { BudgetTemplate, BudgetTemplateData } from '@/types/budgetTemplate';
import { toast } from 'sonner';

export function useBudgetTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        template_data: template.template_data as BudgetTemplateData
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      toast.error('Failed to load budget templates');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: {
    name: string;
    description?: string;
    total_monthly_income: number;
    template_data: BudgetTemplateData;
    is_default?: boolean;
  }) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // If this is being set as default, unset other defaults first
      if (templateData.is_default) {
        await supabase
          .from('budget_templates')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('budget_templates')
        .insert({
          ...templateData,
          user_id: user.id,
          template_data: templateData.template_data as any,
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = {
        ...data,
        template_data: data.template_data as BudgetTemplateData
      };

      setTemplates(prev => [typedData, ...prev]);
      toast.success('Budget template created successfully');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<BudgetTemplate>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('budget_templates')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const updateData = {
        ...updates,
        template_data: updates.template_data ? updates.template_data as any : undefined
      };

      const { data, error } = await supabase
        .from('budget_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const typedData = {
        ...data,
        template_data: data.template_data as BudgetTemplateData
      };

      setTemplates(prev => 
        prev.map(template => template.id === id ? typedData : template)
      );
      toast.success('Budget template updated');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update template';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('budget_templates')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Budget template deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const getDefaultTemplate = () => {
    return templates.find(template => template.is_default) || templates[0];
  };

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getDefaultTemplate,
    refetch: fetchTemplates,
  };
}