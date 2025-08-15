
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types/expense';
import { toast } from 'sonner';
import { useAuth } from '@/auth/contexts/AuthProvider';

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
  const { user } = useAuth();

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) {
        setExpenses([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Start with a basic query
        let query = supabase
          .from('expenses')
          .select('*');
        
        // Apply family filter
        if (filters?.familyId) {
          // Specific family selected
          query = query.eq('family_id', filters.familyId);
        } else {
          // No specific family or "all" families - fetch user's families first
          const { data: families, error: familiesError } = await supabase
            .from('families')
            .select('id')
            .eq('user_id', user.id);
            
          if (familiesError) throw familiesError;
          
          const familyIds = families.map(f => f.id);
          if (familyIds.length > 0) {
            query = query.in('family_id', familyIds);
          } else {
            // User has no families, return empty
            setExpenses([]);
            setIsLoading(false);
            return;
          }
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
        
        const mappedExpenses = data.map((item: any) => ({
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
          receiptImageUrl: item.receipt_image_url,
          taxAmount: item.tax_amount,
          isTaxDeductible: item.is_tax_deductible,
          paymentMethod: item.payment_method,
          tags: item.tags,
          transactionId: item.transaction_id,
          budgetCategoryId: item.budget_category_id,
          expenseType: item.expense_type || 'actual',
          // New fields
          paidOnDate: item.paid_on_date,
          payrollPeriodId: item.payroll_period_id,
          payrollEntryId: item.payroll_entry_id,
        })) as Expense[];
        
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
  }, [
    user,
    filters?.familyId,
    filters?.categoryId,
    filters?.startDate,
    filters?.endDate,
    filters?.place,
    filters?.minAmount,
    filters?.maxAmount,
    filters?.searchTerm
  ]);

  const createExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      // Convert the Expense type to the database schema
      const expenseToInsert: any = {
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
        receipt_image_url: (expenseData as any).receiptImageUrl,
        tax_amount: (expenseData as any).taxAmount,
        is_tax_deductible: (expenseData as any).isTaxDeductible,
        payment_method: (expenseData as any).paymentMethod,
        tags: (expenseData as any).tags,
        transaction_id: (expenseData as any).transactionId,
        budget_category_id: (expenseData as any).budgetCategoryId,
        expense_type: (expenseData as any).expenseType || 'actual',
        // New fields aligned to DB
        paid_on_date: (expenseData as any).paidOnDate,
        payroll_period_id: (expenseData as any).payrollPeriodId,
        payroll_entry_id: (expenseData as any).payrollEntryId,
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseToInsert])
        .select();
      
      if (error) throw error;
      
      // Map the returned data back to our Expense type
      const newExpense = {
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
        receiptImageUrl: data[0].receipt_image_url,
        taxAmount: data[0].tax_amount,
        isTaxDeductible: data[0].is_tax_deductible,
        paymentMethod: data[0].payment_method,
        tags: data[0].tags,
        transactionId: data[0].transaction_id,
        budgetCategoryId: data[0].budget_category_id,
        expenseType: data[0].expense_type || 'actual',
        // New fields
        paidOnDate: data[0].paid_on_date,
        payrollPeriodId: data[0].payroll_period_id,
        payrollEntryId: data[0].payroll_entry_id,
      } as Expense;
      
      setExpenses(prev => [newExpense, ...prev]);
      
      toast("That's saved. Keep going at your own pace.", {
        description: "Your expense has been added successfully."
      });
      
      return newExpense as any;
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
      if ((updates as any).taxAmount !== undefined) updatesToApply.tax_amount = (updates as any).taxAmount;
      if ((updates as any).isTaxDeductible !== undefined) updatesToApply.is_tax_deductible = (updates as any).isTaxDeductible;
      if ((updates as any).paymentMethod !== undefined) updatesToApply.payment_method = (updates as any).paymentMethod;
      if ((updates as any).tags !== undefined) updatesToApply.tags = (updates as any).tags;
      if ((updates as any).transactionId !== undefined) updatesToApply.transaction_id = (updates as any).transactionId;
      if ((updates as any).budgetCategoryId !== undefined) updatesToApply.budget_category_id = (updates as any).budgetCategoryId;
      if ((updates as any).expenseType !== undefined) updatesToApply.expense_type = (updates as any).expenseType;

      // New fields
      if ((updates as any).paidOnDate !== undefined) updatesToApply.paid_on_date = (updates as any).paidOnDate;
      if ((updates as any).payrollPeriodId !== undefined) updatesToApply.payroll_period_id = (updates as any).payrollPeriodId;
      if ((updates as any).payrollEntryId !== undefined) updatesToApply.payroll_entry_id = (updates as any).payrollEntryId;
      
      const { data, error } = await supabase
        .from('expenses')
        .update(updatesToApply)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update the local state
      setExpenses(prev => prev.map(expense => {
        if (expense.id === id) {
          return { ...expense, ...updates } as Expense;
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
