
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ExpenseMember, FamilyMember } from '@/types/expense';
import { toast } from 'sonner';

export const useExpenseMembers = (expenseId?: string) => {
  const [expenseMembers, setExpenseMembers] = useState<ExpenseMember[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!expenseId) {
      setExpenseMembers([]);
      setMembers([]);
      setIsLoading(false);
      return;
    }
    
    const fetchExpenseMembers = async () => {
      setIsLoading(true);
      try {
        // First get the expense members
        const { data: expenseMembersData, error: expenseMembersError } = await supabase
          .from('expense_members')
          .select('*')
          .eq('expense_id', expenseId);
        
        if (expenseMembersError) throw expenseMembersError;
        
        const mappedExpenseMembers: ExpenseMember[] = expenseMembersData.map(item => ({
          id: item.id,
          expenseId: item.expense_id,
          memberId: item.member_id,
          allocationPercentage: item.allocation_percentage,
          createdAt: item.created_at
        }));
        
        setExpenseMembers(mappedExpenseMembers);
        
        // If there are expense members, get the actual member details
        if (mappedExpenseMembers.length > 0) {
          const memberIds = mappedExpenseMembers.map(em => em.memberId);
          
          const { data: membersData, error: membersError } = await supabase
            .from('family_members')
            .select('*')
            .in('id', memberIds);
          
          if (membersError) throw membersError;
          
          const mappedMembers: FamilyMember[] = membersData.map(item => ({
            id: item.id,
            familyId: item.family_id,
            name: item.name,
            type: item.type,
            dateOfBirth: item.date_of_birth,
            notes: item.notes,
            createdAt: item.created_at
          }));
          
          setMembers(mappedMembers);
        }
      } catch (err: any) {
        console.error('Error fetching expense members:', err);
        setError(err);
        toast("We had trouble loading expense members", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenseMembers();
  }, [expenseId]);

  const addMemberToExpense = async (memberId: string, allocationPercentage?: number) => {
    try {
      const expenseMemberToInsert = {
        expense_id: expenseId,
        member_id: memberId,
        allocation_percentage: allocationPercentage
      };
      
      // Check if this expense member already exists
      const { data: existingData } = await supabase
        .from('expense_members')
        .select('id')
        .eq('expense_id', expenseId)
        .eq('member_id', memberId)
        .limit(1);
      
      if (existingData && existingData.length > 0) {
        toast("This family member is already associated with this expense", {
          description: "No changes were made."
        });
        return null;
      }
      
      const { data, error } = await supabase
        .from('expense_members')
        .insert([expenseMemberToInsert])
        .select();
      
      if (error) throw error;
      
      const newExpenseMember: ExpenseMember = {
        id: data[0].id,
        expenseId: data[0].expense_id,
        memberId: data[0].member_id,
        allocationPercentage: data[0].allocation_percentage,
        createdAt: data[0].created_at
      };
      
      setExpenseMembers(prev => [...prev, newExpenseMember]);
      
      // Fetch and add the member details
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .limit(1);
      
      if (memberError) throw memberError;
      
      if (memberData && memberData.length > 0) {
        const newMember: FamilyMember = {
          id: memberData[0].id,
          familyId: memberData[0].family_id,
          name: memberData[0].name,
          type: memberData[0].type,
          dateOfBirth: memberData[0].date_of_birth,
          notes: memberData[0].notes,
          createdAt: memberData[0].created_at
        };
        
        setMembers(prev => [...prev, newMember]);
      }
      
      toast("All set. You're doing beautifully.", {
        description: "Family member has been associated with this expense."
      });
      
      return newExpenseMember;
    } catch (err: any) {
      console.error('Error adding member to expense:', err);
      toast("We couldn't associate this family member with the expense", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateExpenseMember = async (id: string, allocationPercentage: number) => {
    try {
      const { data, error } = await supabase
        .from('expense_members')
        .update({ allocation_percentage: allocationPercentage })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      const updatedExpenseMember: ExpenseMember = {
        id: data[0].id,
        expenseId: data[0].expense_id,
        memberId: data[0].member_id,
        allocationPercentage: data[0].allocation_percentage,
        createdAt: data[0].created_at
      };
      
      setExpenseMembers(prev => prev.map(em => 
        em.id === id ? updatedExpenseMember : em
      ));
      
      toast("All set. You're doing beautifully.", {
        description: "Expense allocation has been updated."
      });
      
      return updatedExpenseMember;
    } catch (err: any) {
      console.error('Error updating expense member:', err);
      toast("We couldn't update this expense allocation", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const removeMemberFromExpense = async (memberId: string) => {
    try {
      const expenseMember = expenseMembers.find(em => em.memberId === memberId);
      
      if (!expenseMember) {
        toast("This family member is not associated with this expense", {
          description: "No changes were made."
        });
        return;
      }
      
      const { error } = await supabase
        .from('expense_members')
        .delete()
        .eq('id', expenseMember.id);
      
      if (error) throw error;
      
      setExpenseMembers(prev => prev.filter(em => em.memberId !== memberId));
      setMembers(prev => prev.filter(m => m.id !== memberId));
      
      toast("That's taken care of.", {
        description: "The family member has been removed from this expense."
      });
    } catch (err: any) {
      console.error('Error removing member from expense:', err);
      toast("We couldn't remove this family member from the expense", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    expenseMembers,
    members,
    isLoading,
    error,
    addMemberToExpense,
    updateExpenseMember,
    removeMemberFromExpense
  };
};
