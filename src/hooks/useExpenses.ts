
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types/expense';
import { toast } from 'sonner';

export interface ExpenseFilters {
  familyId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  place?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export const useExpenses = (filters?: ExpenseFilters) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('expenses')
          .select('*');
        
        // Apply filters if provided
        if (filters?.familyId) {
          query = query.eq('family_id', filters.familyId);
        }
        
        if (filters?.categoryId) {
          query = query.eq('category', filters.categoryId);
        }
        
        if (filters?.startDate) {
          query = query.gte('date', filters.startDate);
        }
        
        if (filters?.endDate) {
          query = query.lte('date', filters.endDate);
        }
        
        if (filters?.place) {
          query = query.ilike('place', `%${filters.place}%`);
        }
        
        if (filters?.minAmount !== undefined) {
          query = query.gte('amount', filters.minAmount);
        }
        
        if (filters?.maxAmount !== undefined) {
          query = query.lte('amount', filters.maxAmount);
        }
        
        if (filters?.searchTerm) {
          query = query.or(`description.ilike.%${filters.searchTerm}%,place.ilike.%${filters.searchTerm}%`);
        }
        
        // Sort by date, newest first
        query = query.order('date', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const mappedExpenses = data.map(item => ({
          id: item.id,
          familyId: item.family_id,
          amount: item.amount,
          description: item.description,
          category: item.category,
          date: item.date,
          place: item.place,
          needsReplacement: item.needs_replacement || false,
          replacementFrequency: item.replacement_frequency,
          nextReplacementDate: item.next_replacement_date,
          receiptUrl: item.receipt_url,
          taxAmount: item.tax_amount,
          isTaxDeductible: item.is_tax_deductible,
          paymentMethod: item.payment_method,
          tags: item.tags,
          transactionId: item.transaction_id
        }));
        
        setExpenses(mappedExpenses);
      } catch (err: any) {
        console.error('Error fetching expenses:', err);
        setError(err);
        toast("We had trouble loading your expenses", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [filters?.familyId, filters?.categoryId, filters?.startDate, filters?.endDate, filters?.place, filters?.minAmount, filters?.maxAmount, filters?.searchTerm]);

  const createExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      // Convert the Expense type to the database schema
      const expenseToInsert = {
        family_id: expenseData.familyId,
        amount: expenseData.amount,
        description: expenseData.description,
        category: expenseData.category,
        date: expenseData.date,
        place: expenseData.place,
        needs_replacement: expenseData.needsReplacement,
        replacement_frequency: expenseData.replacementFrequency,
        next_replacement_date: expenseData.nextReplacementDate,
        receipt_url: expenseData.receiptUrl,
        tax_amount: expenseData.taxAmount,
        is_tax_deductible: expenseData.isTaxDeductible,
        payment_method: expenseData.paymentMethod,
        tags: expenseData.tags,
        transaction_id: expenseData.transactionId
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseToInsert])
        .select();
      
      if (error) throw error;
      
      // Map the returned data back to our Expense type
      const newExpense: Expense = {
        id: data[0].id,
        familyId: data[0].family_id,
        amount: data[0].amount,
        description: data[0].description,
        category: data[0].category,
        date: data[0].date,
        place: data[0].place,
        needsReplacement: data[0].needs_replacement,
        replacementFrequency: data[0].replacement_frequency,
        nextReplacementDate: data[0].next_replacement_date,
        receiptUrl: data[0].receipt_url,
        taxAmount: data[0].tax_amount,
        isTaxDeductible: data[0].is_tax_deductible,
        paymentMethod: data[0].payment_method,
        tags: data[0].tags,
        transactionId: data[0].transaction_id
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      
      toast("That's saved. Keep going at your own pace.", {
        description: "Your expense has been added successfully."
      });
      
      return newExpense;
    } catch (err: any) {
      console.error('Error creating expense:', err);
      toast("We couldn't save your expense", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      // Convert the Expense updates to the database schema
      const updatesToApply: any = {};
      
      if (updates.familyId !== undefined) updatesToApply.family_id = updates.familyId;
      if (updates.amount !== undefined) updatesToApply.amount = updates.amount;
      if (updates.description !== undefined) updatesToApply.description = updates.description;
      if (updates.category !== undefined) updatesToApply.category = updates.category;
      if (updates.date !== undefined) updatesToApply.date = updates.date;
      if (updates.place !== undefined) updatesToApply.place = updates.place;
      if (updates.needsReplacement !== undefined) updatesToApply.needs_replacement = updates.needsReplacement;
      if (updates.replacementFrequency !== undefined) updatesToApply.replacement_frequency = updates.replacementFrequency;
      if (updates.nextReplacementDate !== undefined) updatesToApply.next_replacement_date = updates.nextReplacementDate;
      if (updates.receiptUrl !== undefined) updatesToApply.receipt_url = updates.receiptUrl;
      if (updates.taxAmount !== undefined) updatesToApply.tax_amount = updates.taxAmount;
      if (updates.isTaxDeductible !== undefined) updatesToApply.is_tax_deductible = updates.isTaxDeductible;
      if (updates.paymentMethod !== undefined) updatesToApply.payment_method = updates.paymentMethod;
      if (updates.tags !== undefined) updatesToApply.tags = updates.tags;
      if (updates.transactionId !== undefined) updatesToApply.transaction_id = updates.transactionId;
      
      const { data, error } = await supabase
        .from('expenses')
        .update(updatesToApply)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update the local state
      setExpenses(prev => prev.map(expense => {
        if (expense.id === id) {
          return { ...expense, ...updates };
        }
        return expense;
      }));
      
      toast("All set. You're doing beautifully.", {
        description: "Your expense has been updated."
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating expense:', err);
      toast("We couldn't update your expense", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      toast("That's taken care of.", {
        description: "The expense has been removed."
      });
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      toast("We couldn't remove this expense", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense
  };
};
