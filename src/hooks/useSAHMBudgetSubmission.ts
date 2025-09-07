import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SAHMBudgetData {
  aboutYou: {
    name: string;
    location: string;
    householdSize: number;
    dependents: number;
    email: string;
  };
  income: {
    primaryIncome: { amount: number; frequency: string; source: string; };
    secondaryIncome: { amount: number; frequency: string; source: string; };
    otherIncome: { amount: number; frequency: string; source: string; };
  };
  needs: Record<string, number>;
  wants: Record<string, number>;
  savings: Record<string, number>;
  notes: string;
}

export const useSAHMBudgetSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBudget = async (budgetData: SAHMBudgetData) => {
    setIsSubmitting(true);
    
    try {
      const totalNeeds = Object.values(budgetData.needs).reduce((sum, value) => sum + value, 0);
      const totalWants = Object.values(budgetData.wants).reduce((sum, value) => sum + value, 0);
      const totalSavings = Object.values(budgetData.savings).reduce((sum, value) => sum + value, 0);
      const totalBudget = totalNeeds + totalWants + totalSavings;

      // Calculate total monthly income (convert all to monthly)
      const convertToMonthly = (amount: number, frequency: string): number => {
        switch (frequency) {
          case 'weekly': return amount * 4.33;
          case 'yearly': return amount / 12;
          default: return amount; // monthly
        }
      };

      const totalMonthlyIncome = 
        convertToMonthly(budgetData.income.primaryIncome.amount, budgetData.income.primaryIncome.frequency) +
        convertToMonthly(budgetData.income.secondaryIncome.amount, budgetData.income.secondaryIncome.frequency) +
        convertToMonthly(budgetData.income.otherIncome.amount, budgetData.income.otherIncome.frequency);

      const submission = {
        name: budgetData.aboutYou.name || null,
        email: budgetData.aboutYou.email,
        location: budgetData.aboutYou.location || null,
        household_size: budgetData.aboutYou.householdSize,
        dependents: budgetData.aboutYou.dependents,
        needs_data: budgetData.needs,
        wants_data: budgetData.wants,
        savings_data: budgetData.savings,
        notes: budgetData.notes || null,
        total_needs: totalNeeds,
        total_wants: totalWants,
        total_savings: totalSavings,
        total_budget: totalBudget,
        user_agent: navigator.userAgent,
        // Store income data in additional_info for now
        additional_info: JSON.stringify({
          income: budgetData.income,
          totalMonthlyIncome: totalMonthlyIncome
        })
      };

      const { error } = await supabase
        .from('sahm_budget_submissions')
        .insert([submission]);

      if (error) {
        console.error('Error submitting budget:', error);
        toast.error("Something went wrong", {
          description: "We couldn't save your budget right now. Please try again.",
        });
        return false;
      }

      // Also add to demo_leads for lead tracking
      const leadData = {
        email: budgetData.aboutYou.email,
        name: budgetData.aboutYou.name || 'SAHM Budget User',
        interest_type: 'sahm_budget_builder',
        additional_info: JSON.stringify({
          location: budgetData.aboutYou.location || 'Not provided',
          household: budgetData.aboutYou.householdSize,
          dependents: budgetData.aboutYou.dependents,
          totalBudget: totalBudget,
          totalMonthlyIncome: totalMonthlyIncome,
          income: budgetData.income
        }),
      };

      await supabase
        .from('demo_leads')
        .insert([leadData]);

      toast.success("Budget saved successfully!", {
        description: "Your personalized budget template will be emailed to you shortly. Check your inbox!",
      });

      return true;
    } catch (error) {
      console.error('Error submitting budget:', error);
      toast.error("Something went wrong", {
        description: "We couldn't save your budget right now. Please try again.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBudget,
    isSubmitting,
  };
};