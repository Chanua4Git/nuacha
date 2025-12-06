import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useBudgetTemplates } from './useBudgetTemplates';
import { toast } from 'sonner';
import { format, startOfMonth } from 'date-fns';

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
  actual_paid: number | null;
  payment_date: string | null;
  is_paid: boolean;
  expense_id: string | null;
  notes: string | null;
}

export interface RecurringPaymentSummary {
  totalBudgeted: number;
  totalPaid: number;
  paidCount: number;
  totalCount: number;
  payments: RecurringPayment[];
}

export const useRecurringPayments = (familyId: string | null, month: Date) => {
  const { user } = useAuth();
  const { templates } = useBudgetTemplates(familyId || undefined);
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthStr = format(startOfMonth(month), 'yyyy-MM-dd');

  // Get essential expenses from the active budget template
  const getTemplateEssentials = useCallback(() => {
    const activeTemplate = templates.find(t => t.is_default) || templates[0];
    if (!activeTemplate?.template_data?.needs) return [];

    const needs = activeTemplate.template_data.needs as Record<string, number>;
    return Object.entries(needs)
      .filter(([_, amount]) => amount > 0)
      .map(([key, amount]) => ({
        category_key: key,
        category_name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        budgeted_amount: amount,
        group_type: 'needs',
        template_id: activeTemplate.id,
      }));
  }, [templates]);

  // Fetch existing payments for the month
  const fetchPayments = useCallback(async () => {
    if (!user || !familyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('monthly_recurring_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('family_id', familyId)
        .eq('month', monthStr);

      if (fetchError) throw fetchError;

      const essentials = getTemplateEssentials();
      
      // Merge template essentials with existing payment records
      const mergedPayments: RecurringPayment[] = essentials.map(essential => {
        const existingPayment = data?.find(p => p.category_key === essential.category_key);
        
        if (existingPayment) {
          return {
            ...existingPayment,
            budgeted_amount: essential.budgeted_amount, // Always use template amount
          } as RecurringPayment;
        }

        return {
          user_id: user.id,
          family_id: familyId,
          template_id: essential.template_id,
          category_key: essential.category_key,
          category_name: essential.category_name,
          group_type: essential.group_type,
          month: monthStr,
          budgeted_amount: essential.budgeted_amount,
          actual_paid: null,
          payment_date: null,
          is_paid: false,
          expense_id: null,
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
  }, [user, familyId, monthStr, getTemplateEssentials]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Record a payment
  const recordPayment = useCallback(async (
    categoryKey: string,
    actualPaid: number,
    createExpense: boolean = true
  ) => {
    if (!user || !familyId) return;

    const payment = payments.find(p => p.category_key === categoryKey);
    if (!payment) return;

    try {
      let expenseId = payment.expense_id;

      // Create expense record if requested
      if (createExpense && !expenseId) {
        const { data: expenseData, error: expenseError } = await supabase
          .from('expenses')
          .insert({
            family_id: familyId,
            description: payment.category_name,
            amount: actualPaid,
            date: format(new Date(), 'yyyy-MM-dd'),
            place: 'Recurring Bill',
            category: payment.category_name,
            expense_type: 'recurring',
          })
          .select()
          .single();

        if (expenseError) throw expenseError;
        expenseId = expenseData.id;
      } else if (createExpense && expenseId) {
        // Update existing expense
        await supabase
          .from('expenses')
          .update({ amount: actualPaid })
          .eq('id', expenseId);
      }

      // Upsert the recurring payment record
      const paymentData = {
        user_id: user.id,
        family_id: familyId,
        template_id: payment.template_id,
        category_key: categoryKey,
        category_name: payment.category_name,
        group_type: payment.group_type,
        month: monthStr,
        budgeted_amount: payment.budgeted_amount,
        actual_paid: actualPaid,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        is_paid: true,
        expense_id: expenseId,
      };

      const { error: upsertError } = await supabase
        .from('monthly_recurring_payments')
        .upsert(paymentData, {
          onConflict: 'user_id,family_id,category_key,month',
        });

      if (upsertError) throw upsertError;

      // Update local state
      setPayments(prev => prev.map(p => 
        p.category_key === categoryKey 
          ? { ...p, actual_paid: actualPaid, is_paid: true, expense_id: expenseId }
          : p
      ));

      toast.success(`${payment.category_name} marked as paid`);
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error('Failed to record payment');
    }
  }, [user, familyId, monthStr, payments]);

  // Mark payment as unpaid (remove)
  const removePayment = useCallback(async (categoryKey: string) => {
    if (!user || !familyId) return;

    const payment = payments.find(p => p.category_key === categoryKey);
    if (!payment?.id) return;

    try {
      // Delete the expense if one was created
      if (payment.expense_id) {
        await supabase
          .from('expenses')
          .delete()
          .eq('id', payment.expense_id);
      }

      // Delete the recurring payment record
      await supabase
        .from('monthly_recurring_payments')
        .delete()
        .eq('id', payment.id);

      // Update local state
      setPayments(prev => prev.map(p => 
        p.category_key === categoryKey 
          ? { ...p, actual_paid: null, is_paid: false, expense_id: null, id: undefined }
          : p
      ));

      toast.success(`${payment.category_name} unmarked`);
    } catch (err) {
      console.error('Error removing payment:', err);
      toast.error('Failed to remove payment');
    }
  }, [user, familyId, payments]);

  // Calculate summary
  const summary: RecurringPaymentSummary = {
    totalBudgeted: payments.reduce((sum, p) => sum + p.budgeted_amount, 0),
    totalPaid: payments.reduce((sum, p) => sum + (p.actual_paid || 0), 0),
    paidCount: payments.filter(p => p.is_paid).length,
    totalCount: payments.length,
    payments,
  };

  return {
    payments,
    summary,
    isLoading,
    error,
    recordPayment,
    removePayment,
    refetch: fetchPayments,
  };
};
