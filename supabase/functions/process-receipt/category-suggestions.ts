
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
  
  // Create a whitelist of valid category names from the comprehensive categories
  const validCategoryNames = new Set(categories.map(cat => cat.name.toLowerCase()));
  
  // Add validation function to ensure category exists and prevent "Food" categorization
  const validateCategory = (categoryName: string): string | null => {
    if (!categoryName) return null;
    const normalizedName = categoryName.toLowerCase();
    
    // NEVER allow "food" categorization - always map to groceries
    if (normalizedName === 'food') {
      console.log('Preventing "Food" categorization, mapping to Groceries');
      const groceriesCategory = categories.find(cat => cat.name.toLowerCase() === 'groceries');
      return groceriesCategory ? groceriesCategory.name : 'Groceries';
    }
    
    // Check if category exists in our valid list
    const validCategory = categories.find(cat => cat.name.toLowerCase() === normalizedName);
    if (validCategory) return validCategory.name;
    
    // For grocery-related items, default to groceries if category doesn't exist
    if (normalizedName.includes('grocery') || normalizedName.includes('food')) {
      const groceriesCategory = categories.find(cat => cat.name.toLowerCase() === 'groceries');
      return groceriesCategory ? groceriesCategory.name : 'Groceries';
    }
    
    return null; // Invalid category
  };
  
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

  // Trinidad and Tobago vendor recognition for dining establishments
  const diningVendors = [
    // International chains present in T&T
    'starbucks', 'kfc', 'mcdonald', 'burger king', 'subway', 'pizza hut', 'domino',
    // Local T&T restaurants and dining
    'restaurant', 'cafe', 'coffee', 'diner', 'bistro', 'grill', 'bar', 'pub', 'roti shop',
    'doubles', 'bake and shark', 'fast food', 'takeout', 'delivery', 'lime', 'food court'
  ];

  // Check if this is a dining/restaurant vendor - default coffee/food items to dining out
  const isDiningVendor = diningVendors.some(vendor => 
    vendorName.toLowerCase().includes(vendor)
  );

  // Check if this is a grocery vendor - for T&T specific stores
  const groceryVendors = [
    'jta', 'massy', 'xtrafoods', 'xtra foods', 'hi-lo', 'hilo', 
    'pricesmart', 'price smart', 'truvalu', 'tru valu', 'super pharm', 'superpharm',
    'grocery', 'supermarket', 'market'
  ];
  
  const isGroceryVendor = groceryVendors.some(vendor => 
    vendorName.toLowerCase().includes(vendor)
  );

  console.log(`Vendor analysis - isDining: ${isDiningVendor}, isGrocery: ${isGroceryVendor}, vendor: "${vendorName}"`);

  // PRIORITY 1: If it's a dining vendor, prioritize dining category
  if (isDiningVendor) {
    const diningCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('dining') || 
      cat.name.toLowerCase() === 'dining out' ||
      cat.name.toLowerCase().includes('dining out / takeout') ||
      cat.name.toLowerCase().includes('takeout')
    );
    
    if (diningCategory) {
      console.log(`✅ Dining vendor detected - using category: ${diningCategory.name}`);
      return {
        categoryId: diningCategory.id,
        confidence: 0.9 // High confidence for dining vendor
      };
    }
    
    // Fallback: If no "Dining out" category found, create a fallback suggestion
    console.log(`⚠️ Dining vendor but no Dining out category found - creating fallback`);
    return {
      categoryId: 'dining-out-fallback',
      confidence: 0.8
    };
  }

  // PRIORITY 2: If it's a grocery vendor, prioritize grocery category
  if (isGroceryVendor) {
    // Try multiple variations of grocery category names
    const groceryCategory = categories.find(cat => {
      const catName = cat.name.toLowerCase();
      return catName.includes('groceries') || 
             catName.includes('grocery') ||
             catName === 'food' ||
             catName.includes('food shopping') ||
             catName.includes('supermarket');
    });
    
    if (groceryCategory) {
      console.log(`✅ Grocery vendor detected - using category: ${groceryCategory.name}`);
      return {
        categoryId: groceryCategory.id,
        confidence: 0.85 // Good confidence for grocery vendor
      };
    }
    
    // Enhanced fallback: Try to find the most suitable category
    // Look for food-related, household, or general expense categories
    const fallbackCategory = categories.find(cat => {
      const catName = cat.name.toLowerCase();
      return catName.includes('household') ||
             catName.includes('household operations') ||
             catName.includes('general') ||
             catName.includes('miscellaneous');
    });
    
    if (fallbackCategory) {
      console.log(`⚠️ No Groceries category - using fallback: ${fallbackCategory.name}`);
      return {
        categoryId: fallbackCategory.id,
        confidence: 0.65 // Lower confidence for fallback
      };
    }
    
    // Last resort: Use the first available category
    if (categories.length > 0) {
      console.log(`⚠️ Using first available category: ${categories[0].name}`);
      return {
        categoryId: categories[0].id,
        confidence: 0.5 // Low confidence
      };
    }
    
    // Only use fallback ID if absolutely no categories exist
    console.log(`⚠️ No categories found - creating system fallback`);
    return {
      categoryId: 'groceries-fallback',
      confidence: 0.4
    };
  }

  // PRIORITY 3: Enhanced keyword mapping with brand recognition and fuzzy matching
  const keywordMap: { [key: string]: string[] } = {
    // Food & Groceries - Enhanced with brand names and common terms
    'grocery': ['groceries'],
    'groceries': ['groceries'],
    'produce': ['fresh-produce', 'groceries'],
    'fruit': ['fresh-produce', 'groceries'],
    'fruits': ['fresh-produce', 'groceries'],
    'vegetable': ['fresh-produce', 'groceries'],
    'vegetables': ['fresh-produce', 'groceries'],
    'veggie': ['fresh-produce', 'groceries'],
    'veggies': ['fresh-produce', 'groceries'],
    'pineapple': ['fresh-produce', 'groceries'],
    'grape': ['fresh-produce', 'groceries'],
    'grapes': ['fresh-produce', 'groceries'],
    'banana': ['fresh-produce', 'groceries'],
    'apple': ['fresh-produce', 'groceries'],
    'orange': ['fresh-produce', 'groceries'],
    'lemon': ['fresh-produce', 'groceries'],
    'lime': ['fresh-produce', 'groceries'],
    'tomato': ['fresh-produce', 'groceries'],
    'onion': ['fresh-produce', 'groceries'],
    'potato': ['fresh-produce', 'groceries'],
    'carrot': ['fresh-produce', 'groceries'],
    'chunks': ['fresh-produce', 'groceries'],
    'mixed': ['fresh-produce', 'groceries'],
    
    // Dairy & Eggs - Enhanced with brand names
    'dairy': ['dairy-eggs', 'groceries'],
    'milk': ['dairy-eggs', 'groceries'],
    'cheese': ['dairy-eggs', 'groceries'],
    'eggs': ['dairy-eggs', 'groceries'],
    'egg': ['dairy-eggs', 'groceries'],
    'butter': ['dairy-eggs', 'groceries'],
    'cream': ['dairy-eggs', 'groceries'],
    'yogurt': ['dairy-eggs', 'groceries'],
    'yoghurt': ['dairy-eggs', 'groceries'],
    'yog': ['dairy-eggs', 'groceries'],
    'yoplait': ['dairy-eggs', 'groceries'],
    'dannon': ['dairy-eggs', 'groceries'],
    'chobani': ['dairy-eggs', 'groceries'],
    
    // Pantry & Condiments
    'bread': ['pantry-staples', 'groceries'],
    'rice': ['pantry-staples', 'groceries'],
    'pasta': ['pantry-staples', 'groceries'],
    'cereal': ['pantry-staples', 'groceries'],
    'sauce': ['pantry-staples', 'groceries'],
    'soy sauce': ['pantry-staples', 'groceries'],
    'ketchup': ['pantry-staples', 'groceries'],
    'mustard': ['pantry-staples', 'groceries'],
    'mayo': ['pantry-staples', 'groceries'],
    'oil': ['pantry-staples', 'groceries'],
    'vinegar': ['pantry-staples', 'groceries'],
    'salt': ['pantry-staples', 'groceries'],
    'pepper': ['pantry-staples', 'groceries'],
    'sugar': ['pantry-staples', 'groceries'],
    'flour': ['pantry-staples', 'groceries'],
    'condiment': ['pantry-staples', 'groceries'],
    'seasoning': ['pantry-staples', 'groceries'],
    'spice': ['pantry-staples', 'groceries'],
    'tang': ['beverages', 'groceries'],
    'dole': ['fresh-produce', 'groceries'],
    
    // Meat & Seafood
    'meat': ['meat-seafood', 'groceries'],
    'beef': ['meat-seafood', 'groceries'],
    'chicken': ['meat-seafood', 'groceries'],
    'pork': ['meat-seafood', 'groceries'],
    'ham': ['meat-seafood', 'groceries'],
    'bacon': ['meat-seafood', 'groceries'],
    'sausage': ['meat-seafood', 'groceries'],
    'fish': ['meat-seafood', 'groceries'],
    'seafood': ['meat-seafood', 'groceries'],
    'salmon': ['meat-seafood', 'groceries'],
    'tuna': ['meat-seafood', 'groceries'],
    'shrimp': ['meat-seafood', 'groceries'],
    
    // Frozen Foods
    'frozen': ['frozen-foods', 'groceries'],
    'ice cream': ['frozen-foods', 'groceries'],
    'ice pop': ['frozen-foods', 'groceries'],
    'pop': ['frozen-foods', 'groceries'],
    'popsicle': ['frozen-foods', 'groceries'],
    'frozen food': ['frozen-foods', 'groceries'],
    
    // Beverages
    'beverage': ['beverages', 'groceries'],
    'drinks': ['beverages', 'groceries'],
    'juice': ['beverages', 'groceries'],
    'soda': ['beverages', 'groceries'],
    // 'water' defined later for utilities
    // 'coffee' defined later for dining context
    'tea': ['beverages', 'groceries'],
    'beer': ['beverages', 'groceries'],
    'wine': ['beverages', 'groceries'],
    
    // Snacks & Treats
    'snack': ['snacks-treats', 'groceries'],
    'candy': ['snacks-treats', 'groceries'],
    'chips': ['snacks-treats', 'groceries'],
    'cookies': ['snacks-treats', 'groceries'],
    'crackers': ['snacks-treats', 'groceries'],
    'nuts': ['snacks-treats', 'groceries'],

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

    // Restaurant & Dining - Enhanced with T&T specific items
    'restaurant': ['dining-out', 'dining'],
    'cafe': ['dining-out', 'dining'],
    'coffee shop': ['dining-out', 'dining'],
    'lunch': ['dining-out', 'dining'],
    'dinner': ['dining-out', 'dining'],
    'takeout': ['dining-out', 'dining'],
    'delivery': ['dining-out', 'dining'],
    'pizza': ['dining-out', 'dining'],
    'burger': ['dining-out', 'dining'],
    'fast food': ['dining-out', 'dining'],
    'doubles': ['dining-out', 'dining'],
    'bake and shark': ['dining-out', 'dining'],
    'roti': ['dining-out', 'dining'],
    'pelau': ['dining-out', 'dining'],
    'curry': ['dining-out', 'dining'],
    
    // Coffee & Café items - SHOULD GO TO DINING when from dining vendor
    'coffee': isDiningVendor ? ['dining-out', 'dining'] : ['beverages', 'groceries'],
    'latte': ['dining-out', 'dining'],
    'cappuccino': ['dining-out', 'dining'],
    'espresso': ['dining-out', 'dining'],
    'americano': ['dining-out', 'dining'],
    'macchiato': ['dining-out', 'dining'],
    'mocha': ['dining-out', 'dining'],
    'frappuccino': ['dining-out', 'dining'],

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

  // Enhanced fuzzy matching for grocery items
  let bestCategoryName = null;
  let bestConfidence = 0;
  let matchedKeyword = null;

  console.log(`Categorizing item: "${cleanItemDesc}" from vendor: "${vendorName}"`);

  // Enhanced keyword matching with fuzzy logic
  for (const [keyword, categoryNames] of Object.entries(keywordMap)) {
    let matchFound = false;
    let matchConfidence = 0;

    // Exact keyword match
    if (cleanItemDesc.includes(keyword)) {
      matchFound = true;
      matchConfidence = keyword.length / cleanItemDesc.length;
    }
    // Fuzzy matching for common variations
    else if (keyword.length >= 4) {
      // Check for partial matches (at least 3 characters)
      const keywordStart = keyword.substring(0, Math.min(keyword.length - 1, 4));
      if (cleanItemDesc.includes(keywordStart)) {
        matchFound = true;
        matchConfidence = (keywordStart.length / cleanItemDesc.length) * 0.8; // Reduced confidence for partial match
      }
    }

    if (matchFound && matchConfidence > bestConfidence) {
      bestCategoryName = categoryNames[0];
      bestConfidence = matchConfidence;
      matchedKeyword = keyword;
    }
  }

  console.log(`Best match: keyword="${matchedKeyword}", category="${bestCategoryName}", confidence=${bestConfidence}`);

  // Enhanced category name matching
  if (bestCategoryName) {
    let matchedCategory = null;
    
    // Try exact ID match first
    matchedCategory = categories.find(cat => cat.id === bestCategoryName);
    
    // Try name match if no ID match
    if (!matchedCategory) {
      matchedCategory = categories.find(cat => {
        const catName = cat.name.toLowerCase();
        const searchName = bestCategoryName!.toLowerCase();
        return catName.includes(searchName) || searchName.includes(catName);
      });
    }
    
    // Try parent category search for subcategories
    if (!matchedCategory) {
      matchedCategory = categories.find(cat => {
        const catName = cat.name.toLowerCase();
        // Look for broader category matches
        return (
          (bestCategoryName!.includes('groceries') && catName.includes('groceries')) ||
          (bestCategoryName!.includes('produce') && catName.includes('produce')) ||
          (bestCategoryName!.includes('dairy') && catName.includes('dairy')) ||
          (bestCategoryName!.includes('meat') && catName.includes('meat')) ||
          (bestCategoryName!.includes('frozen') && catName.includes('frozen')) ||
          (bestCategoryName!.includes('snack') && catName.includes('snack'))
        );
      });
    }
    
    if (matchedCategory) {
      console.log(`Found category: ${matchedCategory.name} (${matchedCategory.id})`);
      return {
        categoryId: matchedCategory.id,
        confidence: Math.min(bestConfidence + 0.4, 0.85) // Higher confidence cap for enhanced matching
      };
    }
  }

  // Smart vendor-based categorization - prioritize dining for coffee shops
  if (isDiningVendor) {
    const diningCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('dining') ||
      cat.name.toLowerCase().includes('food') ||
      cat.id === 'dining-out'
    );
    
    if (diningCategory) {
      console.log(`Coffee shop/restaurant detected: ${vendorName} → ${diningCategory.name}`);
      return {
        categoryId: diningCategory.id,
        confidence: 0.85 // High confidence for coffee shop categorization
      };
    }
  }

  // Smart fallback for grocery stores - default to groceries instead of miscellaneous
  if (isGroceryVendor) {
    const groceryCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('groceries') ||
      cat.id === 'groceries'
    );
    
    if (groceryCategory) {
      console.log(`Defaulting to groceries for vendor: ${vendorName}`);
      return {
        categoryId: groceryCategory.id,
        confidence: 0.6 // Moderate confidence for vendor-based categorization
      };
    }
  }

  // If no matches, find the most generic category like "Miscellaneous" or "Other"
  const genericCategory = categories.find(cat => 
    ['other', 'miscellaneous', 'misc', 'general', 'uncategorized']
      .includes(cat.name.toLowerCase())
  );

  if (genericCategory) {
    console.log(`Falling back to generic category: ${genericCategory.name}`);
    return {
      categoryId: genericCategory.id,
      confidence: 0.3 // Low confidence for generic category
    };
  }

  // If all else fails, return the first category (better than nothing)
  if (categories.length > 0) {
    console.log(`Using first available category: ${categories[0].name}`);
    return {
      categoryId: categories[0].id,
      confidence: 0.1 // Very low confidence
    };
  }

  console.log('No category found');
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
