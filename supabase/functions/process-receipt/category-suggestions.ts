
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

  // Comprehensive keyword mapping for enhanced categorization
  const keywordMap: { [key: string]: string[] } = {
    // Food & Groceries
    'grocery': ['groceries', 'food'],
    'groceries': ['groceries', 'food'],
    'produce': ['fresh-produce', 'groceries'],
    'fruit': ['fresh-produce', 'groceries'],
    'fruits': ['fresh-produce', 'groceries'],
    'vegetable': ['fresh-produce', 'groceries'],
    'vegetables': ['fresh-produce', 'groceries'],
    'meat': ['meat-seafood', 'groceries'],
    'beef': ['meat-seafood', 'groceries'],
    'chicken': ['meat-seafood', 'groceries'],
    'fish': ['meat-seafood', 'groceries'],
    'seafood': ['meat-seafood', 'groceries'],
    'dairy': ['dairy-eggs', 'groceries'],
    'milk': ['dairy-eggs', 'groceries'],
    'cheese': ['dairy-eggs', 'groceries'],
    'eggs': ['dairy-eggs', 'groceries'],
    'bread': ['pantry-staples', 'groceries'],
    'rice': ['pantry-staples', 'groceries'],
    'pasta': ['pantry-staples', 'groceries'],
    'cereal': ['pantry-staples', 'groceries'],
    'frozen': ['frozen-foods', 'groceries'],
    'beverage': ['beverages', 'groceries'],
    'drinks': ['beverages', 'groceries'],
    'juice': ['beverages', 'groceries'],
    'soda': ['beverages', 'groceries'],
    'snack': ['snacks-treats', 'groceries'],
    'candy': ['snacks-treats', 'groceries'],
    'chips': ['snacks-treats', 'groceries'],

    // Personal Care & Toiletries
    'toiletries': ['toiletries', 'personal-hygiene'],
    'toothpaste': ['personal-hygiene', 'toiletries'],
    'toothbrush': ['personal-hygiene', 'toiletries'],
    'deodorant': ['personal-hygiene', 'toiletries'],
    'shampoo': ['personal-hygiene', 'toiletries'],
    'conditioner': ['personal-hygiene', 'toiletries'],
    'soap': ['personal-hygiene', 'toiletries'],
    'body wash': ['personal-hygiene', 'toiletries'],
    'lotion': ['skincare', 'personal care'],
    'moisturizer': ['skincare', 'personal care'],
    'sunscreen': ['skincare', 'personal care'],
    'skincare': ['skincare', 'personal care'],
    'makeup': ['makeup-cosmetics', 'personal care'],
    'cosmetic': ['makeup-cosmetics', 'personal care'],
    'lipstick': ['makeup-cosmetics', 'personal care'],
    'foundation': ['makeup-cosmetics', 'personal care'],
    'mascara': ['makeup-cosmetics', 'personal care'],
    'nail': ['nail-care', 'personal care'],
    'feminine': ['feminine-products', 'personal care'],
    'tampons': ['feminine-products', 'personal care'],
    'pads': ['feminine-products', 'personal care'],

    // Clothing & Fashion
    'clothing': ['everyday-clothing', 'clothing'],
    'shirt': ['everyday-clothing', 'clothing'],
    't-shirt': ['everyday-clothing', 'clothing'],
    'pants': ['everyday-clothing', 'clothing'],
    'jeans': ['everyday-clothing', 'clothing'],
    'dress': ['everyday-clothing', 'clothing'],
    'skirt': ['everyday-clothing', 'clothing'],
    'sweater': ['everyday-clothing', 'clothing'],
    'jacket': ['outerwear-coats', 'clothing'],
    'coat': ['outerwear-coats', 'clothing'],
    'shoes': ['shoes-footwear', 'clothing'],
    'boots': ['shoes-footwear', 'clothing'],
    'sandals': ['shoes-footwear', 'clothing'],
    'sneakers': ['shoes-footwear', 'clothing'],
    'socks': ['undergarments-socks', 'clothing'],
    'underwear': ['undergarments-socks', 'clothing'],
    'bra': ['undergarments-socks', 'clothing'],
    'accessories': ['accessories', 'clothing'],
    'jewelry': ['accessories', 'clothing'],
    'belt': ['accessories', 'clothing'],
    'hat': ['accessories', 'clothing'],

    // Household & Cleaning
    'cleaning': ['cleaning-supplies', 'household'],
    'detergent': ['cleaning-supplies', 'household'],
    'bleach': ['cleaning-supplies', 'household'],
    'disinfectant': ['cleaning-supplies', 'household'],
    'paper towel': ['paper-goods', 'household'],
    'toilet paper': ['paper-goods', 'household'],
    'tissue': ['paper-goods', 'household'],
    'napkins': ['paper-goods', 'household'],
    'kitchen': ['kitchen-supplies', 'household'],
    'bathroom': ['bathroom-supplies', 'household'],
    'laundry': ['cleaning-supplies', 'household'],

    // Technology & Electronics
    'phone': ['mobile-phone', 'technology'],
    'smartphone': ['mobile-phone', 'technology'],
    'computer': ['computer-laptop', 'technology'],
    'laptop': ['computer-laptop', 'technology'],
    'tablet': ['electronics-gadgets', 'technology'],
    'software': ['software-apps', 'technology'],
    'app': ['software-apps', 'technology'],
    'electronics': ['electronics-gadgets', 'technology'],
    'headphones': ['electronics-gadgets', 'technology'],
    'speaker': ['electronics-gadgets', 'technology'],
    'charger': ['electronics-gadgets', 'technology'],
    'camera': ['electronics-gadgets', 'technology'],
    'gaming': ['gaming', 'technology'],
    'console': ['gaming', 'technology'],
    'appliance': ['home-appliances', 'technology'],

    // Restaurant & Dining
    'restaurant': ['dining-out', 'dining'],
    'cafe': ['dining-out', 'dining'],
    'coffee': ['dining-out', 'dining'],
    'lunch': ['dining-out', 'dining'],
    'dinner': ['dining-out', 'dining'],
    'takeout': ['dining-out', 'dining'],
    'delivery': ['dining-out', 'dining'],
    'pizza': ['dining-out', 'dining'],
    'burger': ['dining-out', 'dining'],
    'fast food': ['dining-out', 'dining'],

    // Transportation
    'gas': ['fuel', 'transportation'],
    'fuel': ['fuel', 'transportation'],
    'gasoline': ['fuel', 'transportation'],
    'taxi': ['taxi-rideshare', 'transportation'],
    'uber': ['taxi-rideshare', 'transportation'],
    'lyft': ['taxi-rideshare', 'transportation'],
    'rideshare': ['taxi-rideshare', 'transportation'],
    'bus': ['public-transportation', 'transportation'],
    'train': ['public-transportation', 'transportation'],
    'subway': ['public-transportation', 'transportation'],
    'parking': ['transportation', 'vehicle'],
    'toll': ['transportation', 'vehicle'],
    'maintenance': ['vehicle-maintenance', 'transportation'],
    'repair': ['vehicle-maintenance', 'transportation'],

    // Healthcare & Medical
    'medicine': ['medication', 'healthcare'],
    'medication': ['medication', 'healthcare'],
    'prescription': ['medication', 'healthcare'],
    'doctor': ['doctor-visits', 'healthcare'],
    'medical': ['medical-supplies', 'healthcare'],
    'hospital': ['doctor-visits', 'healthcare'],
    'clinic': ['doctor-visits', 'healthcare'],
    'pharmacy': ['medication', 'healthcare'],
    'dentist': ['child-medical', 'healthcare'],
    'dental': ['child-medical', 'healthcare'],
    'vitamin': ['vitamins-supplements', 'healthcare'],
    'supplement': ['vitamins-supplements', 'healthcare'],

    // Utilities & Bills
    'electric': ['electricity', 'utilities'],
    'electricity': ['electricity', 'utilities'],
    'water': ['water-sewer', 'utilities'],
    'gas bill': ['gas', 'utilities'],
    'internet': ['internet-wifi', 'utilities'],
    'wifi': ['internet-wifi', 'utilities'],
    'phone bill': ['mobile-phone', 'utilities'],
    'cable': ['cable-streaming', 'utilities'],
    'streaming': ['cable-streaming', 'utilities'],

    // Entertainment & Leisure
    'movie': ['events-tickets', 'entertainment'],
    'cinema': ['events-tickets', 'entertainment'],
    'theater': ['events-tickets', 'entertainment'],
    'game': ['hobbies-crafts', 'entertainment'],
    'toy': ['child-toys', 'entertainment'],
    'book': ['books-stationery', 'entertainment'],
    'hobby': ['hobbies-crafts', 'entertainment'],
    'sport': ['gym-membership', 'entertainment'],
    'gym': ['gym-membership', 'entertainment'],
    'fitness': ['fitness-equipment', 'entertainment'],
    'subscription': ['subscriptions', 'entertainment'],
    'netflix': ['subscriptions', 'entertainment'],
    'spotify': ['subscriptions', 'entertainment'],

    // Education & Child Care
    'tuition': ['school-fees', 'education'],
    'school': ['school-fees', 'education'],
    'education': ['school-fees', 'education'],
    'class': ['extracurricular', 'education'],
    'course': ['extracurricular', 'education'],
    'childcare': ['childcare', 'education'],
    'daycare': ['childcare', 'education'],
    'babysitting': ['childcare', 'education'],
    'uniform': ['school-uniforms', 'education'],
    'stationery': ['books-stationery', 'education'],
    'supplies': ['books-stationery', 'education'],

    // Insurance & Financial
    'insurance': ['health-insurance', 'insurance'],
    'premium': ['health-insurance', 'insurance'],
    'loan': ['loan-repayments', 'financial'],
    'payment': ['loan-repayments', 'financial'],
    'bank': ['bank-fees', 'financial'],
    'fee': ['bank-fees', 'financial'],
    'savings': ['savings', 'financial'],
    'investment': ['investments', 'financial']
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
