
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

  // Organize categories by group and parent for hierarchical display
  const organizeCategories = (categories: CategoryWithCamelCase[]) => {
    const groups = {
      needs: categories.filter(cat => cat.groupType === 'needs'),
      wants: categories.filter(cat => cat.groupType === 'wants'),
      savings: categories.filter(cat => cat.groupType === 'savings')
    };
    return groups;
  };

  // Handle cases when we're in demo mode and might not have categories
  const renderCategories = () => {
    if (availableCategories.length === 0) {
      // Use comprehensive demo categories with hierarchical structure
      return renderHierarchicalDemoCategories();
    }
    
    // Use real categories if available - organize hierarchically
    const organizedCategories = organizeCategories(availableCategories);
    
    return (
      <>
        {/* NEEDS Section */}
        {organizedCategories.needs.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
              NEEDS (Essential)
            </div>
            {organizedCategories.needs.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id}
                className="flex items-center pl-4"
              >
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: category.color || '#64748B' }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </>
        )}

        {/* WANTS Section */}
        {organizedCategories.wants.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
              WANTS (Discretionary)
            </div>
            {organizedCategories.wants.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id}
                className="flex items-center pl-4"
              >
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: category.color || '#64748B' }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </>
        )}

        {/* SAVINGS Section */}
        {organizedCategories.savings.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
              SAVINGS & INVESTMENTS
            </div>
            {organizedCategories.savings.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id}
                className="flex items-center pl-4"
              >
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: category.color || '#64748B' }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
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
