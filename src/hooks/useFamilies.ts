
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Family } from '@/types/expense';
import { toast } from 'sonner';

export const useFamilies = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFamilies = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('families')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        const mappedFamilies: Family[] = data.map(item => ({
          id: item.id,
          name: item.name,
          color: item.color
        }));
        
        setFamilies(mappedFamilies);
      } catch (err: any) {
        console.error('Error fetching families:', err);
        setError(err);
        toast("We had trouble loading your families", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilies();
  }, []);

  const createFamily = async (familyData: Omit<Family, 'id'>) => {
    try {
      // Get user ID from the session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }
      
      const familyToInsert = {
        name: familyData.name,
        color: familyData.color,
        user_id: session.user.id
      };
      
      const { data, error } = await supabase
        .from('families')
        .insert([familyToInsert])
        .select();
      
      if (error) throw error;
      
      const newFamily: Family = {
        id: data[0].id,
        name: data[0].name,
        color: data[0].color
      };
      
      setFamilies(prev => [...prev, newFamily]);
      
      toast("All set. You're doing beautifully.", {
        description: "Your new family has been created."
      });
      
      return newFamily;
    } catch (err: any) {
      console.error('Error creating family:', err);
      toast("We couldn't create your family", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateFamily = async (id: string, updates: Partial<Family>) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .update({
          name: updates.name,
          color: updates.color
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setFamilies(prev => prev.map(family => {
        if (family.id === id) {
          return { ...family, ...updates };
        }
        return family;
      }));
      
      toast("All set. You're doing beautifully.", {
        description: "Family updated successfully."
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating family:', err);
      toast("We couldn't update this family", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const deleteFamily = async (id: string) => {
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setFamilies(prev => prev.filter(family => family.id !== id));
      
      toast("That's taken care of.", {
        description: "The family has been removed."
      });
    } catch (err: any) {
      console.error('Error deleting family:', err);
      toast("We couldn't remove this family", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    families,
    isLoading,
    error,
    createFamily,
    updateFamily,
    deleteFamily
  };
};
