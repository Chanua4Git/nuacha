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

// Trinidad and Tobago vendor patterns for smart categorization
const VENDOR_PATTERNS: { [key: string]: { category: string; confidence: number } } = {
  // T&T Grocery Stores
  'jta': { category: 'groceries', confidence: 0.95 },
  'massy stores': { category: 'groceries', confidence: 0.95 },
  'massy': { category: 'groceries', confidence: 0.95 },
  'xtrafoods': { category: 'groceries', confidence: 0.95 },
  'xtra foods': { category: 'groceries', confidence: 0.95 },
  'hi-lo': { category: 'groceries', confidence: 0.95 },
  'hilo': { category: 'groceries', confidence: 0.95 },
  'pricesmart': { category: 'groceries', confidence: 0.95 },
  'price smart': { category: 'groceries', confidence: 0.95 },
  'truvalu': { category: 'groceries', confidence: 0.95 },
  'tru valu': { category: 'groceries', confidence: 0.95 },
  'super pharm': { category: 'groceries', confidence: 0.9 },
  'superpharm': { category: 'groceries', confidence: 0.9 },
  
  // International chains present in T&T
  'starbucks': { category: 'dining-out', confidence: 0.95 },
  'mcdonald': { category: 'dining-out', confidence: 0.95 },
  'burger king': { category: 'dining-out', confidence: 0.95 },
  'kfc': { category: 'dining-out', confidence: 0.95 },
  'subway': { category: 'dining-out', confidence: 0.95 },
  'pizza hut': { category: 'dining-out', confidence: 0.95 },
  'domino': { category: 'dining-out', confidence: 0.95 },
  
  // T&T Gas Stations
  'np': { category: 'fuel', confidence: 0.95 },
  'national petroleum': { category: 'fuel', confidence: 0.95 },
  'rubis': { category: 'fuel', confidence: 0.95 },
  'shell': { category: 'fuel', confidence: 0.95 },
  'texaco': { category: 'fuel', confidence: 0.95 },
  'bp': { category: 'fuel', confidence: 0.95 },
  'petrotrin': { category: 'fuel', confidence: 0.95 },
  
  // T&T Banks and Financial
  'rbc': { category: 'bank-fees', confidence: 0.9 },
  'republic bank': { category: 'bank-fees', confidence: 0.9 },
  'first citizens': { category: 'bank-fees', confidence: 0.9 },
  'scotiabank': { category: 'bank-fees', confidence: 0.9 },
  'cibc': { category: 'bank-fees', confidence: 0.9 },
  'linx': { category: 'bank-fees', confidence: 0.85 },
  'atm': { category: 'bank-fees', confidence: 0.8 },
  
  // Pharmacies (generic pattern maintained)
  'pharmacy': { category: 'medication', confidence: 0.85 },
  'drug store': { category: 'medication', confidence: 0.85 },
};

// Line item intelligence for coffee/food items
const LINE_ITEM_PATTERNS: { [key: string]: { category: string; confidence: number } } = {
  // Coffee drinks
  'latte': { category: 'dining-out', confidence: 0.9 },
  'cappuccino': { category: 'dining-out', confidence: 0.9 },
  'espresso': { category: 'dining-out', confidence: 0.9 },
  'americano': { category: 'dining-out', confidence: 0.9 },
  'macchiato': { category: 'dining-out', confidence: 0.9 },
  'mocha': { category: 'dining-out', confidence: 0.9 },
  'frappuccino': { category: 'dining-out', confidence: 0.9 },
  'coffee': { category: 'dining-out', confidence: 0.8 },
  
  // Fast food items
  'burger': { category: 'dining-out', confidence: 0.85 },
  'fries': { category: 'dining-out', confidence: 0.85 },
  'sandwich': { category: 'dining-out', confidence: 0.8 },
  'pizza': { category: 'dining-out', confidence: 0.85 },
  
  // Grocery items (when not from dining vendors)
  'milk': { category: 'groceries', confidence: 0.8 },
  'bread': { category: 'groceries', confidence: 0.8 },
  'eggs': { category: 'groceries', confidence: 0.8 },
  'banana': { category: 'groceries', confidence: 0.75 },
  'apple': { category: 'groceries', confidence: 0.75 },
};

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
        // First check baseline intelligence for vendors and line items
        const baselineSuggestions = getBaselineSuggestions(place, lineItems, categories);
        
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
          // If no historical data, return baseline suggestions only
          if (baselineSuggestions.length > 0) {
            const baselineOnlySuggestions = baselineSuggestions.map(bs => ({
              categoryId: bs.categoryId,
              category: bs.category,
              score: Math.max(bs.merchantScore, bs.lineItemScore),
              confidence: Math.max(bs.merchantScore, bs.lineItemScore) * 100,
              reasons: bs.merchantScore > bs.lineItemScore 
                ? [`Based on ${place} (${bs.category.name})`]
                : ['Based on item analysis']
            }));
            setSuggestions(baselineOnlySuggestions.slice(0, 5));
          } else {
            setSuggestions([]);
          }
          return;
        }

        // Fetch receipt line items for additional context
        const { data: receiptLineItems } = await supabase
          .from('receipt_line_items')
          .select('*')
          .in('expense_id', expenseHistory.map(e => e.id));

        // Calculate scores for each category
        const categoryScores = new Map<string, SuggestionFactors>();
        
        for (const category of categories) {
          const factors: SuggestionFactors = {
            merchantScore: 0,
            lineItemScore: 0,
            frequencyScore: 0,
            recencyScore: 0,
            temporalScore: 0
          };

          // Check if this category has baseline intelligence
          const baselineSuggestion = baselineSuggestions.find(bs => bs.categoryId === category.id);
          if (baselineSuggestion) {
            factors.merchantScore = baselineSuggestion.merchantScore;
            factors.lineItemScore = baselineSuggestion.lineItemScore;
          }

          // Merchant pattern matching from historical data
          if (place) {
            const merchantMatches = expenseHistory.filter(expense => 
              expense.place?.toLowerCase().includes(place.toLowerCase()) && 
              expense.category === category.id
            );
            if (merchantMatches.length > 0) {
              // Combine baseline with historical data
              const historicalScore = Math.min(merchantMatches.length / 10, 1) * 0.9;
              factors.merchantScore = Math.max(factors.merchantScore, historicalScore);
            }
          }

          // Line item pattern matching from historical data
          if (lineItems && lineItems.length > 0) {
            const lineItemKeywords = lineItems.map(item => 
              item.description.toLowerCase().split(' ')
            ).flat();
            
            const itemMatches = receiptLineItems?.filter(lineItem =>
              lineItem.category_id === category.id &&
              lineItemKeywords.some(keyword => 
                lineItem.description.toLowerCase().includes(keyword)
              )
            ) || [];
            
            if (itemMatches.length > 0) {
              const historicalScore = Math.min(itemMatches.length / 5, 1) * 0.8;
              factors.lineItemScore = Math.max(factors.lineItemScore, historicalScore);
            }
          }

          // Frequency analysis
          const categoryUsage = expenseHistory.filter(expense => expense.category === category.id);
          if (categoryUsage.length > 0) {
            factors.frequencyScore = Math.min(categoryUsage.length / 20, 1) * 0.7;
          }

          // Recency analysis (last 30 days)
          const recentUsage = expenseHistory.filter(expense => 
            expense.category === category.id &&
            new Date(expense.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          );
          if (recentUsage.length > 0) {
            factors.recencyScore = Math.min(recentUsage.length / 10, 1) * 0.6;
          }

          // Temporal patterns (time of day, day of week)
          const currentHour = new Date().getHours();
          const currentDay = new Date().getDay();
          
          const temporalMatches = expenseHistory.filter(expense => {
            const expenseDate = new Date(expense.date);
            const hourMatch = Math.abs(expenseDate.getHours() - currentHour) <= 2;
            const dayMatch = expenseDate.getDay() === currentDay;
            return expense.category === category.id && (hourMatch || dayMatch);
          });
          
          if (temporalMatches.length > 0) {
            factors.temporalScore = Math.min(temporalMatches.length / 5, 1) * 0.5;
          }

          categoryScores.set(category.id, factors);
        }

        // Calculate final scores and create suggestions
        const finalSuggestions: SmartSuggestion[] = [];
        
        categoryScores.forEach((factors, categoryId) => {
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

// Helper function to get baseline intelligence suggestions
function getBaselineSuggestions(
  place?: string, 
  lineItems?: ReceiptLineItem[], 
  categories: CategoryWithCamelCase[] = []
): Array<{categoryId: string; category: CategoryWithCamelCase; merchantScore: number; lineItemScore: number}> {
  const suggestions: Array<{categoryId: string; category: CategoryWithCamelCase; merchantScore: number; lineItemScore: number}> = [];
  
  if (!categories.length) return suggestions;
  
  // Check vendor patterns
  if (place) {
    const placeLower = place.toLowerCase();
    for (const [vendorPattern, { category: categoryName, confidence }] of Object.entries(VENDOR_PATTERNS)) {
      if (placeLower.includes(vendorPattern)) {
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(categoryName) || 
          cat.name.toLowerCase() === categoryName ||
          (categoryName === 'dining-out' && (cat.name.toLowerCase().includes('dining') || cat.name.toLowerCase().includes('food')))
        );
        if (matchingCategory) {
          suggestions.push({
            categoryId: matchingCategory.id,
            category: matchingCategory,
            merchantScore: confidence,
            lineItemScore: 0
          });
        }
      }
    }
  }
  
  // Check line item patterns
  if (lineItems && lineItems.length > 0) {
    for (const lineItem of lineItems) {
      const descLower = lineItem.description.toLowerCase();
      for (const [itemPattern, { category: categoryName, confidence }] of Object.entries(LINE_ITEM_PATTERNS)) {
        if (descLower.includes(itemPattern)) {
          const matchingCategory = categories.find(cat => 
            cat.name.toLowerCase().includes(categoryName) || 
            cat.name.toLowerCase() === categoryName ||
            (categoryName === 'dining-out' && (cat.name.toLowerCase().includes('dining') || cat.name.toLowerCase().includes('food')))
          );
          if (matchingCategory) {
            const existing = suggestions.find(s => s.categoryId === matchingCategory.id);
            if (existing) {
              existing.lineItemScore = Math.max(existing.lineItemScore, confidence);
            } else {
              suggestions.push({
                categoryId: matchingCategory.id,
                category: matchingCategory,
                merchantScore: 0,
                lineItemScore: confidence
              });
            }
          }
        }
      }
    }
  }
  
  return suggestions;
}