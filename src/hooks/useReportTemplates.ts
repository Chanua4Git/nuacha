
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ReportTemplate, ReportConfig } from '@/types/accounting';
import { toast } from 'sonner';
import { useAuth } from '@/auth/contexts/AuthProvider';

export const useReportTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('report_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('is_favorite', { ascending: false })
          .order('name');
        
        if (error) throw error;
        
        setTemplates(data as ReportTemplate[]);
      } catch (err: any) {
        console.error('Error fetching report templates:', err);
        setError(err);
        toast("We had trouble loading your report templates", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [user]);

  const createTemplate = async (name: string, type: string, config: ReportConfig) => {
    if (!user) {
      toast("You need to be logged in", {
        description: "Please sign in to save report templates."
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert([{
          user_id: user.id,
          name,
          type,
          config,
          is_favorite: false,
        }])
        .select();
      
      if (error) throw error;
      
      setTemplates(prev => [...prev, data[0] as ReportTemplate]);
      
      toast("Report saved", {
        description: "Your report template has been saved."
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error creating report template:', err);
      toast("We couldn't save your report", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<ReportTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setTemplates(prev => 
        prev.map(template => template.id === id ? { ...template, ...updates, updated_at: new Date().toISOString() } : template)
      );
      
      toast("Report template updated", {
        description: "Your changes have been saved."
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating report template:', err);
      toast("We couldn't update your report", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTemplates(prev => prev.filter(template => template.id !== id));
      
      toast("Report template deleted", {
        description: "The template has been removed."
      });
    } catch (err: any) {
      console.error('Error deleting report template:', err);
      toast("We couldn't delete your report template", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    return updateTemplate(id, { is_favorite: isFavorite });
  };

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavorite
  };
};
