
/**
 * This module provides functionality for suggesting categories for receipt items.
 */

interface Category {
  id: string;
  name: string;
  color: string;
  family_id?: string;
  parent_id?: string;
  budget?: number;
  description?: string;
  icon?: string;
}

interface CategorizationRule {
  id: string;
  user_id: string;
  name: string;
  pattern: string;
  pattern_type: 'vendor' | 'item' | 'description';
  category_id: string;
  priority: number;
  is_active: boolean;
}

interface ReceiptLineItem {
  description: string;
  quantity?: number;
  totalPrice: string;
  confidence: number;
  category?: string;
  discounted?: boolean;
  sku?: string;
  suggestedCategoryId?: string;
  categoryConfidence?: number;
  matchedRuleId?: string;
}

/**
 * Suggest categories for receipt line items based on item description and vendor name
 */
export async function suggestCategories(
  lineItems: ReceiptLineItem[],
  vendorName: string,
  categories: Category[],
  rules: CategorizationRule[]
): Promise<ReceiptLineItem[]> {
  console.log(`Suggesting categories for ${lineItems.length} line items from vendor: ${vendorName}`);
  
  // If we have no categories or rules, return items as is
  if (!categories.length) {
    return lineItems;
  }

  // Process each line item for category suggestions
  return lineItems.map(item => {
    // Try to find a category for this item using rules
    const suggestion = suggestCategoryForItem(item, vendorName, categories, rules);

    if (suggestion) {
      return {
        ...item,
        suggestedCategoryId: suggestion.categoryId,
        categoryConfidence: suggestion.confidence,
        matchedRuleId: suggestion.matchedRuleId
      };
    }
    
    return item;
  });
}

interface CategorySuggestion {
  categoryId: string;
  confidence: number;
  matchedRuleId?: string;
}

/**
 * Suggest a category for a single line item
 */
function suggestCategoryForItem(
  item: ReceiptLineItem,
  vendorName: string,
  categories: Category[],
  rules: CategorizationRule[]
): CategorySuggestion | null {
  // First try to match using rules if available
  if (rules && rules.length > 0) {
    // Try to match vendor name first (usually more reliable)
    if (vendorName) {
      const vendorRule = findMatchingRule(vendorName, 'vendor', rules);
      if (vendorRule) {
        return {
          categoryId: vendorRule.category_id,
          confidence: 0.9, // High confidence for vendor matches
          matchedRuleId: vendorRule.id
        };
      }
    }
    
    // Then try to match the item description
    const itemRule = findMatchingRule(item.description, 'item', rules);
    if (itemRule) {
      return {
        categoryId: itemRule.category_id,
        confidence: 0.85, // Good confidence for item description matches
        matchedRuleId: itemRule.id
      };
    }
  }

  // Fallback to simple pattern matching if no rules match
  // This is a very basic algorithm, could be improved with ML/AI
  const cleanItemDesc = item.description.toLowerCase();

  // Map of category keywords to category names
  const keywordMap: { [key: string]: string[] } = {
    // Food & Groceries
    'grocery': ['food', 'groceries'],
    'produce': ['food', 'groceries'],
    'fruit': ['food', 'groceries'],
    'vegetable': ['food', 'groceries'],
    'meat': ['food', 'groceries'],
    'dairy': ['food', 'groceries'],
    'milk': ['food', 'groceries'],
    'bread': ['food', 'groceries'],

    // Restaurant
    'restaurant': ['dining', 'restaurant'],
    'cafe': ['dining', 'restaurant'],
    'coffee': ['dining', 'restaurant'],
    'lunch': ['dining', 'restaurant'],
    'dinner': ['dining', 'restaurant'],

    // Household
    'cleaning': ['household'],
    'detergent': ['household'],
    'soap': ['household'],
    'paper': ['household'],
    'towel': ['household'],

    // Utilities
    'electric': ['utilities'],
    'water': ['utilities'],
    'gas': ['utilities'],
    'internet': ['utilities'],
    'phone': ['utilities'],

    // Entertainment
    'movie': ['entertainment'],
    'game': ['entertainment'],
    'toy': ['entertainment'],
    'book': ['entertainment'],

    // Transport
    'gas': ['transportation'],
    'fuel': ['transportation'],
    'fare': ['transportation'],
    'ticket': ['transportation'],
    'uber': ['transportation'],
    'lyft': ['transportation'],

    // Clothing
    'shirt': ['clothing'],
    'pants': ['clothing'],
    'dress': ['clothing'],
    'shoes': ['clothing'],
    'jacket': ['clothing'],

    // Health
    'medicine': ['healthcare'],
    'doctor': ['healthcare'],
    'prescription': ['healthcare'],
    'vitamin': ['healthcare'],

    // Education
    'book': ['education'],
    'tuition': ['education'],
    'school': ['education'],
    'class': ['education'],
    'course': ['education']
  };

  // Find if any keywords match the item description
  let bestCategoryName = null;
  let bestConfidence = 0;

  for (const [keyword, categoryNames] of Object.entries(keywordMap)) {
    if (cleanItemDesc.includes(keyword)) {
      // Simple confidence scoring based on how much of the item description matches the keyword
      const confidence = keyword.length / cleanItemDesc.length;
      if (confidence > bestConfidence) {
        bestCategoryName = categoryNames[0]; // Just use the first category name
        bestConfidence = confidence;
      }
    }
  }

  // If we found a category name match, find the category ID
  if (bestCategoryName) {
    const matchedCategory = categories.find(cat => 
      cat.name.toLowerCase().includes(bestCategoryName!.toLowerCase())
    );
    
    if (matchedCategory) {
      return {
        categoryId: matchedCategory.id,
        confidence: Math.min(bestConfidence + 0.3, 0.75) // Cap at 0.75 for keyword matches
      };
    }
  }

  // If no matches, find the most generic category like "Miscellaneous" or "Other"
  const genericCategory = categories.find(cat => 
    ['other', 'miscellaneous', 'misc', 'general', 'uncategorized']
      .includes(cat.name.toLowerCase())
  );

  if (genericCategory) {
    return {
      categoryId: genericCategory.id,
      confidence: 0.3 // Low confidence for generic category
    };
  }

  // If all else fails, return the first category (better than nothing)
  if (categories.length > 0) {
    return {
      categoryId: categories[0].id,
      confidence: 0.1 // Very low confidence
    };
  }

  return null;
}

/**
 * Find a matching rule based on the input text and pattern type
 */
function findMatchingRule(
  text: string,
  patternType: 'vendor' | 'item' | 'description',
  rules: CategorizationRule[]
): CategorizationRule | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  // First filter by pattern type
  const typeRules = rules.filter(rule => rule.pattern_type === patternType);
  
  for (const rule of typeRules) {
    // Simple contains match
    if (lowerText.includes(rule.pattern.toLowerCase())) {
      return rule;
    }
  }
  
  return null;
}
