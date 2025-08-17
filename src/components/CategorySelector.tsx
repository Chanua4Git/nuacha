
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { useCategories } from '@/hooks/useCategories';
import { Tag, RefreshCw } from 'lucide-react';
import { CategoryWithCamelCase } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAllDemoCategories, findDemoCategory, comprehensiveCategories } from '@/data/comprehensiveCategories';

interface CategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  suggestedCategoryId?: string;
  includeAllOption?: boolean; // Add this prop for Reports page
}

const CategorySelector = ({ value, onChange, className, suggestedCategoryId, includeAllOption }: CategorySelectorProps) => {
  const { selectedFamily } = useExpense();
  
  // Use the categories hook directly to get fresh data
  const { categories, isLoading: categoriesLoading, refetch } = useCategories(selectedFamily?.id);
  
  // Filter categories to show general ones + those for the selected family
  // Include user-level budget categories when familyId is null
  const availableCategories = categories.filter(cat => 
    (cat.id && cat.id !== '') && (
      !cat.familyId || 
      (selectedFamily && cat.familyId === selectedFamily.id) ||
      (cat.userId && !cat.familyId) // Include user-level budget categories
    )
  );
  
  const getCategory = (id: string): CategoryWithCamelCase | undefined => 
    categories.find(c => c.id === id);
  
  const selectedCategory = value ? getCategory(value) : undefined;
  const suggestedCategory = suggestedCategoryId ? getCategory(suggestedCategoryId) : undefined;

  // Use suggested category if available and no category is selected
  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
  };

  // Map database categories to their parent categories from comprehensiveCategories
  const mapDatabaseCategoryToParent = (category: CategoryWithCamelCase) => {
    // Create a mapping of category names to their parent categories
    const categoryMapping: { [key: string]: string } = {
      // Housing & Utilities
      'rent': 'housing-utilities', 'mortgage': 'housing-utilities', 'electricity': 'housing-utilities',
      'water': 'housing-utilities', 'gas': 'housing-utilities', 'internet': 'housing-utilities',
      'cable': 'housing-utilities', 'streaming': 'housing-utilities', 'garbage': 'housing-utilities',
      
      // Caregiving & Medical
      'nurse': 'caregiving-medical', 'doctor': 'caregiving-medical', 'medical': 'caregiving-medical',
      'medication': 'caregiving-medical', 'specialist': 'caregiving-medical', 'emotional': 'caregiving-medical',
      
      // Household Operations
      'cleaning': 'household-operations', 'housekeeper': 'household-operations', 'laundry': 'household-operations',
      'care': 'household-operations', 'garden': 'household-operations', 'yard': 'household-operations',
      'pool': 'household-operations', 'pest': 'household-operations', 'repairs': 'household-operations',
      
      // Groceries & Household Supplies
      'groceries': 'groceries-household', 'pet food': 'groceries-household', 'toiletries': 'groceries-household',
      'paper goods': 'groceries-household',
      
      // Transportation
      'fuel': 'transportation', 'taxi': 'transportation', 'rideshare': 'transportation',
      'public transport': 'transportation', 'vehicle': 'transportation',
      
      // Insurance & Financial
      'insurance': 'insurance-financial', 'loan': 'insurance-financial', 'debt': 'insurance-financial',
      'bank': 'insurance-financial', 'savings': 'insurance-financial', 'investments': 'insurance-financial',
      
      // Personal Care & Wellness
      'haircut': 'personal-care', 'grooming': 'personal-care', 'spa': 'personal-care',
      'massage': 'personal-care', 'gym': 'personal-care', 'vitamins': 'personal-care',
      
      // Education & Child Expenses
      'school': 'education-child', 'books': 'education-child', 'stationery': 'education-child',
      'childcare': 'education-child', 'tutoring': 'education-child', 'child': 'education-child',
      'toys': 'education-child', 'uniform': 'education-child',
      
      // Entertainment & Leisure
      'dining': 'entertainment-leisure', 'restaurant': 'entertainment-leisure', 'subscription': 'entertainment-leisure',
      'events': 'entertainment-leisure', 'tickets': 'entertainment-leisure', 'hobbies': 'entertainment-leisure',
      
      // Gifts & Special Occasions
      'gift': 'gifts-occasions', 'birthday': 'gifts-occasions', 'holiday': 'gifts-occasions',
      'anniversary': 'gifts-occasions', 'wedding': 'gifts-occasions', 'celebration': 'gifts-occasions',
      
      // Travel & Holidays
      'travel': 'travel-holidays', 'flight': 'travel-holidays', 'accommodation': 'travel-holidays',
      'hotel': 'travel-holidays', 'vacation': 'travel-holidays', 'tour': 'travel-holidays'
    };
    
    // Find parent category by matching keywords in category name
    const categoryName = category.name.toLowerCase();
    for (const [keyword, parentId] of Object.entries(categoryMapping)) {
      if (categoryName.includes(keyword)) {
        return parentId;
      }
    }
    
    // Default to miscellaneous if no match found
    return 'miscellaneous';
  };

  // Organize categories hierarchically under their parent categories
  const organizeCategories = (categories: CategoryWithCamelCase[]) => {
    const parentGroups = {
      needs: {} as { [parentId: string]: CategoryWithCamelCase[] },
      wants: {} as { [parentId: string]: CategoryWithCamelCase[] },
      savings: {} as { [parentId: string]: CategoryWithCamelCase[] }
    };

    // Group categories under their parent categories
    categories.forEach(category => {
      const parentId = mapDatabaseCategoryToParent(category);
      const parentCategory = comprehensiveCategories.find(p => p.id === parentId);
      
      if (parentCategory) {
        const groupType = category.groupType as keyof typeof parentGroups;
        if (!parentGroups[groupType][parentId]) {
          parentGroups[groupType][parentId] = [];
        }
        parentGroups[groupType][parentId].push(category);
      }
    });

    // Sort categories within each parent group alphabetically
    Object.keys(parentGroups).forEach(groupKey => {
      const group = parentGroups[groupKey as keyof typeof parentGroups];
      if (group) {
        Object.keys(group).forEach(parentId => {
          const categoryArray = group[parentId];
          if (categoryArray && Array.isArray(categoryArray)) {
            categoryArray.sort((a, b) => a.name.localeCompare(b.name));
          }
        });
      }
    });

    return parentGroups;
  };

  // Render hierarchical categories for both demo and real data
  const renderCategories = () => {
    if (availableCategories.length === 0) {
      // Use comprehensive demo categories with hierarchical structure
      return renderHierarchicalDemoCategories();
    }
    
    // Use real categories organized hierarchically under parent headers
    const organizedCategories = organizeCategories(availableCategories);
    
    // Get parent categories for each group from comprehensiveCategories
    const needsParents = comprehensiveCategories.filter(cat => cat.group === 'needs');
    const wantsParents = comprehensiveCategories.filter(cat => cat.group === 'wants');
    const savingsParents = comprehensiveCategories.filter(cat => cat.group === 'savings');
    
    return (
      <>
        {/* NEEDS Section */}
        {Object.keys(organizedCategories.needs).length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
              NEEDS (Essential)
            </div>
            {needsParents.map(parentCategory => {
              const childCategories = organizedCategories.needs[parentCategory.id] || [];
              if (childCategories.length === 0) return null;
              
              return (
                <div key={parentCategory.id}>
                  {/* Parent Category Header - Non-selectable */}
                  <div className="px-2 py-1 text-xs font-medium text-foreground bg-muted/20 border-l-2" 
                       style={{ borderLeftColor: parentCategory.color }}>
                    {parentCategory.name}
                  </div>
                  {/* Child Categories */}
                  {childCategories.map(category => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      className="flex items-center pl-6"
                    >
                      <div className="flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                          style={{ backgroundColor: parentCategory.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* WANTS Section */}
        {Object.keys(organizedCategories.wants).length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
              WANTS (Discretionary)
            </div>
            {wantsParents.map(parentCategory => {
              const childCategories = organizedCategories.wants[parentCategory.id] || [];
              if (childCategories.length === 0) return null;
              
              return (
                <div key={parentCategory.id}>
                  {/* Parent Category Header - Non-selectable */}
                  <div className="px-2 py-1 text-xs font-medium text-foreground bg-muted/20 border-l-2" 
                       style={{ borderLeftColor: parentCategory.color }}>
                    {parentCategory.name}
                  </div>
                  {/* Child Categories */}
                  {childCategories.map(category => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      className="flex items-center pl-6"
                    >
                      <div className="flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                          style={{ backgroundColor: parentCategory.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* SAVINGS Section */}
        {Object.keys(organizedCategories.savings).length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
              SAVINGS & INVESTMENTS
            </div>
            {savingsParents.map(parentCategory => {
              const childCategories = organizedCategories.savings[parentCategory.id] || [];
              if (childCategories.length === 0) return null;
              
              return (
                <div key={parentCategory.id}>
                  {/* Parent Category Header - Non-selectable */}
                  <div className="px-2 py-1 text-xs font-medium text-foreground bg-muted/20 border-l-2" 
                       style={{ borderLeftColor: parentCategory.color }}>
                    {parentCategory.name}
                  </div>
                  {/* Child Categories */}
                  {childCategories.map(category => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      className="flex items-center pl-6"
                    >
                      <div className="flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                          style={{ backgroundColor: parentCategory.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </>
    );
  };

  // Render hierarchical demo categories
  const renderHierarchicalDemoCategories = () => {
    const needsCategories = comprehensiveCategories.filter(cat => cat.group === 'needs');
    const wantsCategories = comprehensiveCategories.filter(cat => cat.group === 'wants');
    const savingsCategories = comprehensiveCategories.filter(cat => cat.group === 'savings');

    return (
      <>
        {/* NEEDS Section */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
          NEEDS (Essential)
        </div>
        {needsCategories.map(parentCategory => (
          <div key={parentCategory.id}>
            {/* Parent Category Header - Non-selectable */}
            <div className="px-2 py-1 text-xs font-medium text-foreground bg-muted/20 border-l-2" 
                 style={{ borderLeftColor: parentCategory.color }}>
              {parentCategory.name}
            </div>
            {/* Child Categories */}
            {parentCategory.children?.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
              <SelectItem 
                key={child.id} 
                value={child.id}
                className="flex items-center pl-6"
              >
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: child.color }}
                  />
                  {child.name}
                </div>
              </SelectItem>
            ))}
          </div>
        ))}

        {/* WANTS Section */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
          WANTS (Discretionary)
        </div>
        {wantsCategories.map(parentCategory => (
          <div key={parentCategory.id}>
            {/* Parent Category Header - Non-selectable */}
            <div className="px-2 py-1 text-xs font-medium text-foreground bg-muted/20 border-l-2" 
                 style={{ borderLeftColor: parentCategory.color }}>
              {parentCategory.name}
            </div>
            {/* Child Categories */}
            {parentCategory.children?.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
              <SelectItem 
                key={child.id} 
                value={child.id}
                className="flex items-center pl-6"
              >
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: child.color }}
                  />
                  {child.name}
                </div>
              </SelectItem>
            ))}
          </div>
        ))}

        {/* SAVINGS Section */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
          SAVINGS & INVESTMENTS
        </div>
        {savingsCategories.map(parentCategory => (
          <div key={parentCategory.id}>
            {/* Parent Category Header - Non-selectable */}
            <div className="px-2 py-1 text-xs font-medium text-foreground bg-muted/20 border-l-2" 
                 style={{ borderLeftColor: parentCategory.color }}>
              {parentCategory.name}
            </div>
            {/* Child Categories */}
            {parentCategory.children?.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
              <SelectItem 
                key={child.id} 
                value={child.id}
                className="flex items-center pl-6"
              >
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: child.color }}
                  />
                  {child.name}
                </div>
              </SelectItem>
            ))}
          </div>
        ))}
      </>
    );
  };

  // Handle selected category display for demo modes
  const renderSelectedCategory = () => {
    if (selectedCategory) {
      return (
        <div className="flex items-center">
          <span 
            className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
            style={{ backgroundColor: selectedCategory.color || '#64748B' }}
          />
          {selectedCategory.name}
        </div>
      );
    }
    
    // Demo mode - check if we have a value but no matching category
    if (value && (value.startsWith('demo-') || value.includes('-'))) {
      const demoCategory = findDemoCategory(value);
      
      if (demoCategory) {
        return (
          <div className="flex items-center">
            <span 
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
              style={{ backgroundColor: demoCategory.color }}
            />
            {demoCategory.name}
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
          <label className="text-sm font-medium">Category</label>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            aria-label="Refresh categories"
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", categoriesLoading ? "animate-spin" : "")} />
          </Button>
        </div>
      </div>
      <Select
        value={value || undefined}
        onValueChange={handleSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a category">
            {renderSelectedCategory()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50 bg-background border shadow-md">
          {includeAllOption && (
            <SelectItem value="all_categories">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0 bg-muted" />
                All Categories
              </div>
            </SelectItem>
          )}
          
          {suggestedCategory && suggestedCategory.id !== value && suggestedCategory.id && (
            <SelectItem 
              value={suggestedCategory.id} 
              className="font-medium border-b border-dashed border-gray-200 pb-1 mb-1"
            >
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: suggestedCategory.color || '#64748B' }}
                />
                {suggestedCategory.name} (Suggested)
              </div>
            </SelectItem>
          )}
          
          {renderCategories()}
        </SelectContent>
      </Select>
      
      {suggestedCategory && !value && (
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-primary">Suggestion:</span> {suggestedCategory.name}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
