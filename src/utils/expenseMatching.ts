import { CategoryWithCamelCase } from '@/types/expense';
import { Expense } from '@/types/expense';

/**
 * Matches an expense to a budget category using the same logic as useBudgetSummary
 * 1. First try to match by expense.category (UUID)
 * 2. Then fallback to expense.budgetCategoryId 
 * 3. Then fallback to matching by category name
 * 
 * Supports both camelCase Expense objects and snake_case database objects
 */
export function matchExpenseToCategory(
  expense: Expense | any, // Allow snake_case DB objects
  categories: CategoryWithCamelCase[] | any[] // Allow snake_case DB objects
): CategoryWithCamelCase | any | undefined {
  // First try to match by expense.category (UUID)
  let category = categories.find(cat => cat.id === (expense.category || expense.category));
  
  // Fallback to expense.budgetCategoryId (camelCase) or budget_category_id (snake_case)
  if (!category) {
    category = categories.find(cat => cat.id === (expense.budgetCategoryId || expense.budget_category_id));
  }
  
  // Final fallback to matching by name
  if (!category) {
    category = categories.find(cat => cat.name === (expense.category || expense.category));
  }
  
  return category;
}