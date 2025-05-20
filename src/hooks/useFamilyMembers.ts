
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FamilyMember } from '@/types/expense';
import { toast } from 'sonner';

export const useFamilyMembers = (familyId?: string) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!familyId) {
      setMembers([]);
      setIsLoading(false);
      return;
    }
    
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyId)
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        const mappedMembers: FamilyMember[] = data.map(item => ({
          id: item.id,
          familyId: item.family_id,
          name: item.name,
          type: item.type,
          dateOfBirth: item.date_of_birth,
          notes: item.notes,
          createdAt: item.created_at
        }));
        
        setMembers(mappedMembers);
      } catch (err: any) {
        console.error('Error fetching family members:', err);
        setError(err);
        toast("We had trouble loading family members", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [familyId]);

  const createMember = async (memberData: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    try {
      const memberToInsert = {
        family_id: memberData.familyId,
        name: memberData.name,
        type: memberData.type,
        date_of_birth: memberData.dateOfBirth,
        notes: memberData.notes
      };
      
      const { data, error } = await supabase
        .from('family_members')
        .insert([memberToInsert])
        .select();
      
      if (error) throw error;
      
      const newMember: FamilyMember = {
        id: data[0].id,
        familyId: data[0].family_id,
        name: data[0].name,
        type: data[0].type,
        dateOfBirth: data[0].date_of_birth,
        notes: data[0].notes,
        createdAt: data[0].created_at
      };
      
      setMembers(prev => [...prev, newMember]);
      
      toast("All set. You're doing beautifully.", {
        description: "Family member has been added."
      });
      
      return newMember;
    } catch (err: any) {
      console.error('Error creating family member:', err);
      toast("We couldn't add this family member", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateMember = async (id: string, updates: Partial<FamilyMember>) => {
    try {
      const memberUpdates: any = {};
      
      if (updates.name) memberUpdates.name = updates.name;
      if (updates.type) memberUpdates.type = updates.type;
      if (updates.dateOfBirth !== undefined) memberUpdates.date_of_birth = updates.dateOfBirth;
      if (updates.notes !== undefined) memberUpdates.notes = updates.notes;
      
      const { data, error } = await supabase
        .from('family_members')
        .update(memberUpdates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      const updatedMember: FamilyMember = {
        id: data[0].id,
        familyId: data[0].family_id,
        name: data[0].name,
        type: data[0].type,
        dateOfBirth: data[0].date_of_birth,
        notes: data[0].notes,
        createdAt: data[0].created_at
      };
      
      setMembers(prev => prev.map(member => 
        member.id === id ? updatedMember : member
      ));
      
      toast("All set. You're doing beautifully.", {
        description: "Family member has been updated."
      });
      
      return updatedMember;
    } catch (err: any) {
      console.error('Error updating family member:', err);
      toast("We couldn't update this family member", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMembers(prev => prev.filter(member => member.id !== id));
      
      toast("That's taken care of.", {
        description: "The family member has been removed."
      });
    } catch (err: any) {
      console.error('Error deleting family member:', err);
      toast("We couldn't remove this family member", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    members,
    isLoading,
    error,
    createMember,
    updateMember,
    deleteMember
  };
};
