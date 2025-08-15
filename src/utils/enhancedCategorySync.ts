import { supabase } from '@/integrations/supabase/client';

// Enhanced category synchronization with validation and migration
export const validateCategoryConsistency = async (userId: string) => {
  try {
    // Get user's families
    const { data: families } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', userId);

    if (!families || families.length === 0) {
      return { success: true, message: 'No families found' };
    }

    const issues: string[] = [];

    // Check for missing essential categories across all families
    for (const family of families) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('family_id', family.id);

      const categoryNames = categories?.map(c => c.name.toLowerCase()) || [];
      
      // Essential categories that should exist
      const essentialCategories = [
        'groceries', 'toiletries', 'personal care', 'clothing', 
        'technology', 'transportation', 'healthcare', 'utilities'
      ];

      for (const essential of essentialCategories) {
        const hasCategory = categoryNames.some(name => 
          name.includes(essential) || name.includes(essential.replace(' ', ''))
        );
        
        if (!hasCategory) {
          issues.push(`Family ${family.id} missing essential category: ${essential}`);
        }
      }
    }

    return {
      success: issues.length === 0,
      issues,
      message: issues.length === 0 ? 'All categories consistent' : `Found ${issues.length} issues`
    };

  } catch (error) {
    console.error('Error validating category consistency:', error);
    return { success: false, message: 'Validation failed', error };
  }
};

// Migrate existing categories to new comprehensive structure
export const migrateCategoriesForUser = async (userId: string) => {
  try {
    // Get user's families
    const { data: families } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', userId);

    if (!families || families.length === 0) {
      return { success: false, message: 'No families found' };
    }

    let migratedCount = 0;
    const migrationLog: string[] = [];

    for (const family of families) {
      // Get existing categories
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('family_id', family.id);

      if (!existingCategories) continue;

      // Map old categories to new structure
      const categoryMappings = [
        { old: 'Personal Care', new: 'Personal Care & Wellness' },
        { old: 'Household', new: 'Groceries & Household Supplies' },
        { old: 'Electronics', new: 'Technology & Electronics' },
        { old: 'Clothes', new: 'Clothing & Fashion' },
        { old: 'Clothing', new: 'Clothing & Fashion' },
        { old: 'Fashion', new: 'Clothing & Fashion' }
      ];

      for (const mapping of categoryMappings) {
        const oldCategory = existingCategories.find(c => 
          c.name.toLowerCase().includes(mapping.old.toLowerCase())
        );

        if (oldCategory) {
          // Update the category name
          const { error } = await supabase
            .from('categories')
            .update({ name: mapping.new })
            .eq('id', oldCategory.id);

          if (!error) {
            migratedCount++;
            migrationLog.push(`Updated "${mapping.old}" to "${mapping.new}" for family ${family.id}`);
          }
        }
      }
    }

    return {
      success: true,
      migratedCount,
      migrationLog,
      message: `Migrated ${migratedCount} categories`
    };

  } catch (error) {
    console.error('Error migrating categories:', error);
    return { success: false, message: 'Migration failed', error };
  }
};

// Add vendor-based categorization rules
export const createDefaultCategorizationRules = async (userId: string) => {
  try {
    // Get user's categories to find IDs
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId);

    if (!categories || categories.length === 0) {
      return { success: false, message: 'No categories found for user' };
    }

    // Common vendor-to-category mappings
    const vendorRules = [
      // Grocery stores
      { vendor: 'walmart', category: 'groceries' },
      { vendor: 'target', category: 'groceries' },
      { vendor: 'kroger', category: 'groceries' },
      { vendor: 'safeway', category: 'groceries' },
      { vendor: 'whole foods', category: 'groceries' },
      { vendor: 'costco', category: 'groceries' },
      
      // Pharmacies / Personal Care
      { vendor: 'cvs', category: 'personal care' },
      { vendor: 'walgreens', category: 'personal care' },
      { vendor: 'rite aid', category: 'personal care' },
      
      // Gas stations
      { vendor: 'shell', category: 'fuel' },
      { vendor: 'bp', category: 'fuel' },
      { vendor: 'exxon', category: 'fuel' },
      { vendor: 'chevron', category: 'fuel' },
      
      // Restaurants
      { vendor: 'mcdonald', category: 'dining' },
      { vendor: 'starbucks', category: 'dining' },
      { vendor: 'subway', category: 'dining' },
      { vendor: 'pizza', category: 'dining' },
      
      // Technology
      { vendor: 'best buy', category: 'technology' },
      { vendor: 'apple', category: 'technology' },
      { vendor: 'microsoft', category: 'technology' },
      
      // Clothing
      { vendor: 'h&m', category: 'clothing' },
      { vendor: 'zara', category: 'clothing' },
      { vendor: 'gap', category: 'clothing' },
      { vendor: 'old navy', category: 'clothing' }
    ];

    let createdRules = 0;

    for (const rule of vendorRules) {
      // Find matching category
      const category = categories.find(c => 
        c.name.toLowerCase().includes(rule.category) ||
        c.name.toLowerCase().includes(rule.category.replace(' ', ''))
      );

      if (category) {
        // Check if rule already exists
        const { data: existingRule } = await supabase
          .from('categorization_rules')
          .select('id')
          .eq('user_id', userId)
          .eq('pattern', rule.vendor)
          .eq('pattern_type', 'vendor')
          .single();

        if (!existingRule) {
          // Create the rule
          const { error } = await supabase
            .from('categorization_rules')
            .insert({
              user_id: userId,
              name: `Auto-categorize ${rule.vendor}`,
              pattern: rule.vendor,
              pattern_type: 'vendor',
              category_id: category.id,
              priority: 10,
              is_active: true
            });

          if (!error) {
            createdRules++;
          }
        }
      }
    }

    return {
      success: true,
      createdRules,
      message: `Created ${createdRules} vendor categorization rules`
    };

  } catch (error) {
    console.error('Error creating categorization rules:', error);
    return { success: false, message: 'Failed to create rules', error };
  }
};

// Bulk categorize uncategorized expenses
export const bulkCategorizeExpenses = async (userId: string) => {
  try {
    // Get user's families
    const { data: families } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', userId);

    if (!families || families.length === 0) {
      return { success: false, message: 'No families found' };
    }

    let categorizedCount = 0;
    const categorizedLog: string[] = [];

    for (const family of families) {
      // Get uncategorized expenses (or expenses with generic categories)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, description, place, category')
        .eq('family_id', family.id)
        .or('category.eq.Miscellaneous,category.eq.Other,category.eq.Uncategorized');

      if (!expenses || expenses.length === 0) continue;

      // Get categories for this family
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('family_id', family.id);

      if (!categories) continue;

      // Import auto-categorization function
      const { autoCategorizeExpense } = await import('./categoryInit');

      for (const expense of expenses) {
        const suggestedCategoryId = autoCategorizeExpense(
          expense.description, 
          expense.place, 
          categories
        );

        if (suggestedCategoryId && suggestedCategoryId !== expense.category) {
          const category = categories.find(c => c.id === suggestedCategoryId);
          
          // Update the expense
          const { error } = await supabase
            .from('expenses')
            .update({ category: category?.name || suggestedCategoryId })
            .eq('id', expense.id);

          if (!error) {
            categorizedCount++;
            categorizedLog.push(
              `Categorized "${expense.description}" as "${category?.name}" for family ${family.id}`
            );
          }
        }
      }
    }

    return {
      success: true,
      categorizedCount,
      categorizedLog,
      message: `Automatically categorized ${categorizedCount} expenses`
    };

  } catch (error) {
    console.error('Error bulk categorizing expenses:', error);
    return { success: false, message: 'Bulk categorization failed', error };
  }
};