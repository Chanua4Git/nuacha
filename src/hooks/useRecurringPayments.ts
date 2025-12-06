import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useBudgetTemplates } from './useBudgetTemplates';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string;
}

export interface RecurringPayment {
  id?: string;
  user_id: string;
  family_id: string | null;
  template_id: string | null;
  category_key: string;
  category_name: string;
  group_type: string;
  month: string;
  budgeted_amount: number;
  total_paid: number; // Running total of all payments
  payment_entries: PaymentEntry[]; // Individual payment records
  notes: string | null;
}

export interface RecurringPaymentSummary {
  totalBudgeted: number;
  totalPaid: number;
  categoriesWithPayments: number;
  totalCount: number;
  payments: RecurringPayment[];
}

export const useRecurringPayments = (familyId: string | null, month: Date) => {
  const { user } = useAuth();
  const { templates, isLoading: templatesLoading } = useBudgetTemplates(familyId || undefined);
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthStr = format(monthStart, 'yyyy-MM-dd');

  // Fetch existing payments for the month by querying expenses
  const fetchPayments = useCallback(async () => {
    if (!user || !familyId || templatesLoading) {
      if (!templatesLoading) setIsLoading(false);
      return;
    }

    // Get essential expenses from the active budget template (inline to avoid dependency issues)
    const activeTemplate = templates.find(t => t.is_default) || templates[0];
    if (!activeTemplate?.template_data?.needs) {
      setPayments([]);
      setIsLoading(false);
      return;
    }

    const needs = activeTemplate.template_data.needs as Record<string, number>;
    const essentials = Object.entries(needs)
      .filter(([_, amount]) => amount > 0)
      .map(([key, amount]) => ({
        category_key: key,
        category_name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        budgeted_amount: amount,
        group_type: 'needs',
        template_id: activeTemplate.id,
      }));

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all expenses for this family in this month
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('id, description, amount, date, category')
        .eq('family_id', familyId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (expenseError) throw expenseError;

      // Build payment records by matching expenses to essential categories
      const mergedPayments: RecurringPayment[] = essentials.map(essential => {
        // Find all expenses that match this category (by name in description or category)
        const matchingExpenses = (expenses || []).filter(exp => {
          const expDescription = exp.description?.toLowerCase() || '';
          const expCategory = exp.category?.toLowerCase() || '';
          const categoryName = essential.category_name.toLowerCase();
          const categoryKey = essential.category_key.toLowerCase();
          
          return expDescription.includes(categoryName) || 
                 expDescription.includes(categoryKey) ||
                 expCategory.includes(categoryName) ||
                 expCategory.includes(categoryKey) ||
                 expDescription === categoryName;
        });

        const paymentEntries: PaymentEntry[] = matchingExpenses.map(exp => ({
          id: exp.id,
          amount: exp.amount,
          date: exp.date,
        }));

        const totalPaid = paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);

        return {
          user_id: user.id,
          family_id: familyId,
          template_id: essential.template_id,
          category_key: essential.category_key,
          category_name: essential.category_name,
          group_type: essential.group_type,
          month: monthStr,
          budgeted_amount: essential.budgeted_amount,
          total_paid: totalPaid,
          payment_entries: paymentEntries,
          notes: null,
        };
      });

      setPayments(mergedPayments);
    } catch (err) {
      console.error('Error fetching recurring payments:', err);
      setError('Failed to load recurring payments');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, familyId, monthStr, templatesLoading, templates.length]);

  useEffect(() => {
    if (!templatesLoading) {
      fetchPayments();
    }
  }, [fetchPayments, templatesLoading]);

  // Add a new payment (creates a new expense entry)
  const addPayment = useCallback(async (
    categoryKey: string,
    amount: number
  ) => {
    if (!user || !familyId) return;

    const payment = payments.find(p => p.category_key === categoryKey);
    if (!payment) return;

    try {
      // Create a new expense record
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          family_id: familyId,
          description: payment.category_name,
          amount: amount,
          date: format(new Date(), 'yyyy-MM-dd'),
          place: 'Monthly Bill',
          category: payment.category_name,
          expense_type: 'actual', // Fixed: use 'actual' instead of 'recurring'
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Update local state with new entry
      setPayments(prev => prev.map(p => {
        if (p.category_key === categoryKey) {
          const newEntry: PaymentEntry = {
            id: expenseData.id,
            amount: amount,
            date: expenseData.date,
          };
          return {
            ...p,
            total_paid: p.total_paid + amount,
            payment_entries: [...p.payment_entries, newEntry],
          };
        }
        return p;
      }));

      toast.success(`Added ${payment.category_name} payment of $${amount.toFixed(2)}`);
    } catch (err) {
      console.error('Error adding payment:', err);
      toast.error('Failed to record payment');
    }
  }, [user, familyId, payments]);

  // Remove a specific payment entry
  const removePaymentEntry = useCallback(async (categoryKey: string, entryId: string) => {
    if (!user || !familyId) return;

    const payment = payments.find(p => p.category_key === categoryKey);
    if (!payment) return;

    const entry = payment.payment_entries.find(e => e.id === entryId);
    if (!entry) return;

    try {
      // Delete the expense record
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      // Update local state
      setPayments(prev => prev.map(p => {
        if (p.category_key === categoryKey) {
          const updatedEntries = p.payment_entries.filter(e => e.id !== entryId);
          return {
            ...p,
            total_paid: p.total_paid - entry.amount,
            payment_entries: updatedEntries,
          };
        }
        return p;
      }));

      toast.success(`Removed payment from ${payment.category_name}`);
    } catch (err) {
      console.error('Error removing payment:', err);
      toast.error('Failed to remove payment');
    }
  }, [user, familyId, payments]);

  // Remove the most recent payment for a category
  const removeLastPayment = useCallback(async (categoryKey: string) => {
    const payment = payments.find(p => p.category_key === categoryKey);
    if (!payment || payment.payment_entries.length === 0) return;

    // Get the most recent entry
    const lastEntry = payment.payment_entries[payment.payment_entries.length - 1];
    await removePaymentEntry(categoryKey, lastEntry.id);
  }, [payments, removePaymentEntry]);

  // Calculate summary
  const summary: RecurringPaymentSummary = {
    totalBudgeted: payments.reduce((sum, p) => sum + p.budgeted_amount, 0),
    totalPaid: payments.reduce((sum, p) => sum + p.total_paid, 0),
    categoriesWithPayments: payments.filter(p => p.payment_entries.length > 0).length,
    totalCount: payments.length,
    payments,
  };

  return {
    payments,
    summary,
    isLoading,
    error,
    addPayment,
    removePaymentEntry,
    removeLastPayment,
    refetch: fetchPayments,
  };
};
