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
  'jta': { category: 'Groceries', confidence: 0.95 },
  'massy stores': { category: 'Groceries', confidence: 0.95 },
  'massy': { category: 'Groceries', confidence: 0.95 },
  'xtrafoods': { category: 'Groceries', confidence: 0.95 },
  'xtra foods': { category: 'Groceries', confidence: 0.95 },
  'hi-lo': { category: 'Groceries', confidence: 0.95 },
  'hilo': { category: 'Groceries', confidence: 0.95 },
  'pricesmart': { category: 'Groceries', confidence: 0.95 },
  'price smart': { category: 'Groceries', confidence: 0.95 },
  'truvalu': { category: 'Groceries', confidence: 0.95 },
  'tru valu': { category: 'Groceries', confidence: 0.95 },
  'super pharm': { category: 'Groceries', confidence: 0.9 },
  'superpharm': { category: 'Groceries', confidence: 0.9 },
  
  // T&T Restaurants, Cafes & Dining
  'trademark bistro': { category: 'Dining out', confidence: 0.95 },
  'trademark': { category: 'Dining out', confidence: 0.9 },
  'buzo osteria': { category: 'Dining out', confidence: 0.95 },
  'buzo': { category: 'Dining out', confidence: 0.9 },
  'jaffa': { category: 'Dining out', confidence: 0.95 },
  'more vino': { category: 'Dining out', confidence: 0.95 },
  'shakers': { category: 'Dining out', confidence: 0.95 },
  'rituals coffee': { category: 'Dining out', confidence: 0.95 },
  'rituals': { category: 'Dining out', confidence: 0.9 },
  'cafe': { category: 'Dining out', confidence: 0.85 },
  'bistro': { category: 'Dining out', confidence: 0.9 },
  'restaurant': { category: 'Dining out', confidence: 0.9 },
  'bar': { category: 'Dining out', confidence: 0.85 },
  'grill': { category: 'Dining out', confidence: 0.9 },
  
  // International chains present in T&T
  'starbucks': { category: 'Dining out', confidence: 0.95 },
  'mcdonald': { category: 'Dining out', confidence: 0.95 },
  'burger king': { category: 'Dining out', confidence: 0.95 },
  'kfc': { category: 'Dining out', confidence: 0.95 },
  'subway': { category: 'Dining out', confidence: 0.95 },
  'pizza hut': { category: 'Dining out', confidence: 0.95 },
  'domino': { category: 'Dining out', confidence: 0.95 },
  
  // T&T Gas Stations
  'np': { category: 'Fuel', confidence: 0.95 },
  'national petroleum': { category: 'Fuel', confidence: 0.95 },
  'rubis': { category: 'Fuel', confidence: 0.95 },
  'shell': { category: 'Fuel', confidence: 0.95 },
  'texaco': { category: 'Fuel', confidence: 0.95 },
  'bp': { category: 'Fuel', confidence: 0.95 },
  'petrotrin': { category: 'Fuel', confidence: 0.95 },
  
  // T&T Banks and Financial
  'rbc': { category: 'Bank fees', confidence: 0.9 },
  'republic bank': { category: 'Bank fees', confidence: 0.9 },
  'first citizens': { category: 'Bank fees', confidence: 0.9 },
  'scotiabank': { category: 'Bank fees', confidence: 0.9 },
  'cibc': { category: 'Bank fees', confidence: 0.9 },
  'linx': { category: 'Bank fees', confidence: 0.85 },
  'atm': { category: 'Bank fees', confidence: 0.8 },
  
  // Utilities
  't&tec': { category: 'Electricity', confidence: 0.95 },
  'wasa': { category: 'Water & Sewer', confidence: 0.95 },
  'ngc': { category: 'Gas', confidence: 0.95 },
  'digicel': { category: 'Internet / Wi-Fi', confidence: 0.9 },
  'bmobile': { category: 'Internet / Wi-Fi', confidence: 0.9 },
  'tstt': { category: 'Internet / Wi-Fi', confidence: 0.9 },
  'flow': { category: 'Internet / Wi-Fi', confidence: 0.9 },
  
  // Pharmacies (generic pattern maintained)
  'pharmacy': { category: 'Medication', confidence: 0.85 },
  'drug store': { category: 'Medication', confidence: 0.85 },
};

// Line item intelligence for coffee/food items
const LINE_ITEM_PATTERNS: { [key: string]: { category: string; confidence: number } } = {
  // Coffee drinks and cafe items
  'cookie': { category: 'Dining out', confidence: 0.9 },
  'cookies': { category: 'Dining out', confidence: 0.9 },
  'pastry': { category: 'Dining out', confidence: 0.9 },
  'croissant': { category: 'Dining out', confidence: 0.9 },
  'muffin': { category: 'Dining out', confidence: 0.9 },
  'cake': { category: 'Dining out', confidence: 0.85 },
  'latte': { category: 'Dining out', confidence: 0.9 },
  'cappuccino': { category: 'Dining out', confidence: 0.9 },
  'espresso': { category: 'Dining out', confidence: 0.9 },
  'americano': { category: 'Dining out', confidence: 0.9 },
  'macchiato': { category: 'Dining out', confidence: 0.9 },
  'mocha': { category: 'Dining out', confidence: 0.9 },
  'frappuccino': { category: 'Dining out', confidence: 0.9 },
  'coffee': { category: 'Dining out', confidence: 0.8 },
  'tea': { category: 'Dining out', confidence: 0.75 },
  
  // Fast food items
  'burger': { category: 'Dining out', confidence: 0.85 },
  'fries': { category: 'Dining out', confidence: 0.85 },
  'sandwich': { category: 'Dining out', confidence: 0.8 },
  'pizza': { category: 'Dining out', confidence: 0.85 },
  'wings': { category: 'Dining out', confidence: 0.85 },
  'wrap': { category: 'Dining out', confidence: 0.8 },
  
  // Trinidad & Tobago specific foods
  'doubles': { category: 'Dining out', confidence: 0.95 },
  'bake and shark': { category: 'Dining out', confidence: 0.95 },
  'roti': { category: 'Dining out', confidence: 0.9 },
  'pelau': { category: 'Dining out', confidence: 0.9 },
  'callaloo': { category: 'Dining out', confidence: 0.9 },
  'macaroni pie': { category: 'Dining out', confidence: 0.9 },
  'curry': { category: 'Dining out', confidence: 0.8 },
  
  // Grocery items (when not from dining vendors)
  'milk': { category: 'Groceries', confidence: 0.8 },
  'bread': { category: 'Groceries', confidence: 0.8 },
  'eggs': { category: 'Groceries', confidence: 0.8 },
  'banana': { category: 'Groceries', confidence: 0.75 },
  'apple': { category: 'Groceries', confidence: 0.75 },
  'rice': { category: 'Groceries', confidence: 0.8 },
  'chicken': { category: 'Groceries', confidence: 0.8 },
  'beef': { category: 'Groceries', confidence: 0.8 },
  'vegetables': { category: 'Groceries', confidence: 0.8 },
  'fruits': { category: 'Groceries', confidence: 0.8 },
  
  // T&T specific grocery items
  'dasheen': { category: 'Groceries', confidence: 0.9 },
  'yam': { category: 'Groceries', confidence: 0.9 },
  'plantain': { category: 'Groceries', confidence: 0.9 },
  'coconut': { category: 'Groceries', confidence: 0.85 },
  'cassava': { category: 'Groceries', confidence: 0.9 },
  'eddoes': { category: 'Groceries', confidence: 0.9 },
  'ochro': { category: 'Groceries', confidence: 0.85 },
  'pumpkin': { category: 'Groceries', confidence: 0.8 },
  
  // Personal care items
  'shampoo': { category: 'Toiletries', confidence: 0.9 },
  'toothpaste': { category: 'Toiletries', confidence: 0.9 },
  'soap': { category: 'Toiletries', confidence: 0.9 },
  'deodorant': { category: 'Toiletries', confidence: 0.9 },
  'toilet paper': { category: 'Paper goods', confidence: 0.9 },
  'tissue': { category: 'Paper goods', confidence: 0.8 },
  'paper towel': { category: 'Paper goods', confidence: 0.8 },
};

// Helper to check if a string is a valid UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
    console.log('🔍 Smart Suggestions Hook called with:', {
      place,
      lineItemsCount: lineItems?.length || 0,
      lineItems: lineItems?.map(item => item.description),
      familyId,
      categoriesCount: categories.length,
      user: !!user
    });

    if (!place || categories.length === 0) {
      console.log('❌ Early return - missing place or categories:', { place, categoriesCount: categories.length });
      setSuggestions([]);
      return;
    }

    const generateSuggestions = async () => {
      setIsLoading(true);
      try {
        // First check baseline intelligence for vendors and line items
        const baselineSuggestions = getBaselineSuggestions(place, lineItems, categories);
        console.log('📊 Baseline suggestions:', baselineSuggestions);
        
        // For demo users or users without valid family UUID, return baseline suggestions only
        if (!user || !familyId || !isValidUUID(familyId)) {
          console.log('👤 Demo user or no family - using baseline only');
          if (baselineSuggestions.length > 0) {
            const baselineOnlySuggestions = baselineSuggestions.map(bs => ({
              categoryId: bs.categoryId,
              category: bs.category,
              confidence: Math.round((bs.merchantScore + bs.lineItemScore) * 50), // Convert to percentage
              score: bs.merchantScore + bs.lineItemScore,
              reasons: [
                ...(bs.merchantScore > 0 ? [`Smart match for "${place}"`] : []),
                ...(bs.lineItemScore > 0 ? ['Based on item analysis'] : [])
              ].slice(0, 1),
              factors: {
                merchant: bs.merchantScore,
                lineItem: bs.lineItemScore,
                frequency: 0,
                recency: 0,
                temporal: 0
              }
            }));
            
            console.log('✅ Generated baseline suggestions for demo user:', baselineOnlySuggestions);
            setSuggestions(baselineOnlySuggestions.slice(0, 3)); // Limit to top 3
          } else {
            console.log('❌ No baseline suggestions found');
            setSuggestions([]);
          }
          setIsLoading(false);
          return;
        }
        
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
            factors.lineItemScore * 0.40 +  // 🔥 PRIMARY SIGNAL: Line items now dominate categorization
            factors.frequencyScore * 0.15 +
            factors.recencyScore * 0.10 +
            factors.temporalScore * 0.05
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
  console.log('🧠 getBaselineSuggestions called with:', {
    place,
    lineItemsCount: lineItems?.length || 0,
    lineItems: lineItems?.map(item => item.description),
    categoriesCount: categories.length,
    categoryNames: categories.map(c => c.name).slice(0, 5) // First 5 for brevity
  });

  const suggestions: Array<{categoryId: string; category: CategoryWithCamelCase; merchantScore: number; lineItemScore: number}> = [];
  
  if (!categories.length) {
    console.log('❌ No categories provided to getBaselineSuggestions');
    return suggestions;
  }
  
  // Check vendor patterns
  if (place) {
    const placeLower = place.toLowerCase();
    for (const [vendorPattern, { category: categoryName, confidence }] of Object.entries(VENDOR_PATTERNS)) {
      if (placeLower.includes(vendorPattern)) {
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(categoryName.toLowerCase()) || 
          cat.name.toLowerCase() === categoryName.toLowerCase() ||
          (categoryName === 'Dining out' && (cat.name.toLowerCase().includes('dining') || cat.name.toLowerCase().includes('restaurant')))
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
    console.log('🏷️ Checking line item patterns...');
    for (const lineItem of lineItems) {
      const descLower = lineItem.description.toLowerCase();
      console.log('🔍 Processing line item:', descLower);
      for (const [itemPattern, { category: categoryName, confidence }] of Object.entries(LINE_ITEM_PATTERNS)) {
        if (descLower.includes(itemPattern)) {
          console.log(`✅ Found line item match: "${itemPattern}" -> "${categoryName}" (${confidence})`);
          const matchingCategory = categories.find(cat => 
            cat.name.toLowerCase().includes(categoryName.toLowerCase()) || 
            cat.name.toLowerCase() === categoryName.toLowerCase() ||
            (categoryName === 'Dining out' && (cat.name.toLowerCase().includes('dining') || cat.name.toLowerCase().includes('restaurant')))
          );
          if (matchingCategory) {
            console.log(`✅ Found matching category: "${matchingCategory.name}" (id: ${matchingCategory.id})`);
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
          } else {
            console.log(`❌ No matching category found for: "${categoryName}"`);
          }
        }
      }
    }
  }
  
  console.log('🎯 Final baseline suggestions:', suggestions);
  return suggestions;
}