import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CategoryWithCamelCase, ReceiptLineItem } from '@/types/expense';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface SmartSuggestion {
  categoryId: string;
  category: CategoryWithCamelCase;
  score: number;
  confidence: number;
  reasons: string[];
}

interface SuggestionFactors {
  merchantScore: number;
  lineItemScore: number;
  frequencyScore: number;
  recencyScore: number;
  temporalScore: number;
}

export const useSmartCategorySuggestions = (
  place?: string,
  lineItems?: ReceiptLineItem[],
  familyId?: string,
  categories: CategoryWithCamelCase[] = []
) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !familyId || !place || categories.length === 0) {
      setSuggestions([]);
      return;
    }

    const generateSuggestions = async () => {
      setIsLoading(true);
      try {
        // Fetch recent expense history for the family (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: expenseHistory } = await supabase
          .from('expenses')
          .select('*')
          .eq('family_id', familyId)
          .gte('date', sixMonthsAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (!expenseHistory) {
          setSuggestions([]);
          return;
        }

        // Fetch receipt line items for additional context
        const { data: receiptLineItems } = await supabase
          .from('receipt_line_items')
          .select('*')
          .in('expense_id', expenseHistory.map(e => e.id));

        const categorySuggestions: Map<string, SuggestionFactors> = new Map();

        categories.forEach(category => {
          categorySuggestions.set(category.id, {
            merchantScore: 0,
            lineItemScore: 0,
            frequencyScore: 0,
            recencyScore: 0,
            temporalScore: 0
          });
        });

        // 1. MERCHANT SCORE (30% weight)
        const normalizedPlace = place.toLowerCase().trim();
        const merchantMatches = expenseHistory.filter(expense => 
          expense.place && expense.place.toLowerCase().includes(normalizedPlace.split(' ')[0])
        );
        
        merchantMatches.forEach(expense => {
          if (expense.category && categorySuggestions.has(expense.category)) {
            const factors = categorySuggestions.get(expense.category)!;
            factors.merchantScore += 1;
          }
        });

        // Normalize merchant scores
        const maxMerchantMatches = Math.max(...Array.from(categorySuggestions.values()).map(f => f.merchantScore));
        if (maxMerchantMatches > 0) {
          categorySuggestions.forEach(factors => {
            factors.merchantScore = factors.merchantScore / maxMerchantMatches;
          });
        }

        // 2. LINE ITEM SCORE (25% weight)
        if (lineItems && lineItems.length > 0) {
          const lineItemKeywords = lineItems.map(item => 
            item.description.toLowerCase().split(' ')
          ).flat();

          // Check against historical receipt line items
          receiptLineItems?.forEach(item => {
            if (item.expense_id) {
              const expense = expenseHistory.find(e => e.id === item.expense_id);
              if (expense?.category && categorySuggestions.has(expense.category)) {
                const itemKeywords = item.description.toLowerCase().split(' ');
                const matchCount = lineItemKeywords.filter(keyword => 
                  itemKeywords.some(itemKeyword => itemKeyword.includes(keyword) || keyword.includes(itemKeyword))
                ).length;
                
                if (matchCount > 0) {
                  const factors = categorySuggestions.get(expense.category)!;
                  factors.lineItemScore += matchCount / lineItemKeywords.length;
                }
              }
            }
          });

          // Use suggested categories from line items if available
          lineItems.forEach(item => {
            if (item.suggestedCategoryId && categorySuggestions.has(item.suggestedCategoryId)) {
              const factors = categorySuggestions.get(item.suggestedCategoryId)!;
              factors.lineItemScore += (item.categoryConfidence || 0.5);
            }
          });
        }

        // 3. FREQUENCY SCORE (20% weight)
        const categoryFrequency = new Map<string, number>();
        expenseHistory.forEach(expense => {
          if (expense.category) {
            categoryFrequency.set(expense.category, (categoryFrequency.get(expense.category) || 0) + 1);
          }
        });

        const maxFrequency = Math.max(...Array.from(categoryFrequency.values()));
        if (maxFrequency > 0) {
          categoryFrequency.forEach((count, categoryId) => {
            if (categorySuggestions.has(categoryId)) {
              const factors = categorySuggestions.get(categoryId)!;
              factors.frequencyScore = count / maxFrequency;
            }
          });
        }

        // 4. RECENCY SCORE (15% weight)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentExpenses = expenseHistory.filter(expense => 
          new Date(expense.date) >= thirtyDaysAgo
        );

        const recentCategoryCount = new Map<string, number>();
        recentExpenses.forEach(expense => {
          if (expense.category) {
            recentCategoryCount.set(expense.category, (recentCategoryCount.get(expense.category) || 0) + 1);
          }
        });

        const maxRecentCount = Math.max(...Array.from(recentCategoryCount.values()));
        if (maxRecentCount > 0) {
          recentCategoryCount.forEach((count, categoryId) => {
            if (categorySuggestions.has(categoryId)) {
              const factors = categorySuggestions.get(categoryId)!;
              factors.recencyScore = count / maxRecentCount;
            }
          });
        }

        // 5. TEMPORAL SCORE (10% weight)
        const now = new Date();
        const currentHour = now.getHours();
        const currentDayOfWeek = now.getDay();

        const temporalMatches = expenseHistory.filter(expense => {
          const expenseDate = new Date(expense.date);
          const expenseHour = expenseDate.getHours();
          const expenseDayOfWeek = expenseDate.getDay();
          
          return Math.abs(expenseHour - currentHour) <= 2 || expenseDayOfWeek === currentDayOfWeek;
        });

        const temporalCategoryCount = new Map<string, number>();
        temporalMatches.forEach(expense => {
          if (expense.category) {
            temporalCategoryCount.set(expense.category, (temporalCategoryCount.get(expense.category) || 0) + 1);
          }
        });

        const maxTemporalCount = Math.max(...Array.from(temporalCategoryCount.values()));
        if (maxTemporalCount > 0) {
          temporalCategoryCount.forEach((count, categoryId) => {
            if (categorySuggestions.has(categoryId)) {
              const factors = categorySuggestions.get(categoryId)!;
              factors.temporalScore = count / maxTemporalCount;
            }
          });
        }

        // Calculate final scores and create suggestions
        const finalSuggestions: SmartSuggestion[] = [];
        
        categorySuggestions.forEach((factors, categoryId) => {
          const category = categories.find(c => c.id === categoryId);
          if (!category) return;

          const score = (
            factors.merchantScore * 0.30 +
            factors.lineItemScore * 0.25 +
            factors.frequencyScore * 0.20 +
            factors.recencyScore * 0.15 +
            factors.temporalScore * 0.10
          );

          // Only include suggestions with meaningful scores
          if (score > 0.1) {
            const reasons: string[] = [];
            if (factors.merchantScore > 0.3) reasons.push(`Based on ${place} purchases`);
            if (factors.lineItemScore > 0.3) reasons.push('Similar items purchased');
            if (factors.frequencyScore > 0.5) reasons.push('Frequently used');
            if (factors.recencyScore > 0.3) reasons.push('Recently used');
            if (factors.temporalScore > 0.3) reasons.push('Common at this time');

            finalSuggestions.push({
              categoryId,
              category,
              score,
              confidence: Math.min(score * 100, 95), // Cap confidence at 95%
              reasons: reasons.length > 0 ? reasons : ['Based on spending patterns']
            });
          }
        });

        // Sort by score and take top 5
        finalSuggestions.sort((a, b) => b.score - a.score);
        setSuggestions(finalSuggestions.slice(0, 5));

      } catch (error) {
        console.error('Error generating smart suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateSuggestions();
  }, [user, familyId, place, lineItems, categories]);

  return {
    suggestions,
    isLoading
  };
};