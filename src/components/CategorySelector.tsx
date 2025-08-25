
import { useMemo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';
import { useSmartCategorySuggestions } from '@/hooks/useSmartCategorySuggestions';
import { Tag, RefreshCw, Sparkles, TrendingUp, Clock, Calendar } from 'lucide-react';
import { CategoryWithCamelCase, ReceiptLineItem } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAllDemoCategories, findDemoCategory, comprehensiveCategories } from '@/data/comprehensiveCategories';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface CategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  suggestedCategoryId?: string;
  includeAllOption?: boolean; // Add this prop for Reports page
  place?: string; // For smart suggestions
  lineItems?: ReceiptLineItem[]; // For smart suggestions
}

const CategorySelector = ({ value, onChange, className, suggestedCategoryId, includeAllOption, place, lineItems }: CategorySelectorProps) => {
  const { selectedFamily } = useExpense();
  const { user } = useAuth();

  // Use unified categories for consistent behavior across the app
  const { 
    categories: unifiedCategories, 
    budgetCategories,
    isLoading: categoriesLoading, 
    refetch 
  } = useUnifiedCategories({
    familyId: selectedFamily?.id,
    mode: user ? 'unified' : 'all', // Use unified mode for logged-in users, all for demo
  });

  // Get all available categories (unified for logged-in users, demo for others)
  const allCategories = useMemo(() => {
    if (!user) {
      // Demo mode - use comprehensive demo categories
      return getAllDemoCategories();
    }
    
    // Logged-in user - use unified categories
    return unifiedCategories;
  }, [user, unifiedCategories]);
  
  // Get smart suggestions based on place and line items
  const { suggestions, isLoading: suggestionsLoading } = useSmartCategorySuggestions(
    place,
    lineItems,
    selectedFamily?.id,
    allCategories
  );
  
  const getCategory = (id: string): CategoryWithCamelCase | any => {
    if (!user) {
      // Demo mode - find in demo categories
      return getAllDemoCategories().find(c => c.id === id || c.name === id);
    }
    return unifiedCategories.find(c => c.id === id);
  };
  
  const selectedCategory = value ? getCategory(value) : undefined;
  const suggestedCategory = suggestedCategoryId ? getCategory(suggestedCategoryId) : undefined;

  // Use suggested category if available and no category is selected
  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
  };

  const groupedCategories = useMemo(() => {
    const grouped = {
      needs: [] as typeof allCategories,
      wants: [] as typeof allCategories,
      savings: [] as typeof allCategories,
      other: [] as typeof allCategories
    };
    
    allCategories.forEach(category => {
      const groupType = ('groupType' in category ? category.groupType : category.group) as 'needs' | 'wants' | 'savings';
      
      if (groupType === 'needs') {
        grouped.needs.push(category);
      } else if (groupType === 'wants') {
        grouped.wants.push(category);
      } else if (groupType === 'savings') {
        grouped.savings.push(category);
      } else {
        // Handle categories without proper groupType
        grouped.other.push(category);
      }
    });
    
    // Sort each group alphabetically
    Object.values(grouped).forEach(group => {
      group.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [allCategories]);

  // Render smart suggestions section
  const renderSmartSuggestions = () => {
    if (suggestions.length === 0) return null;

    const getReasonIcon = (reason: string) => {
      if (reason.includes('purchases')) return <TrendingUp className="w-3 h-3 text-primary/60" />;
      if (reason.includes('items')) return <Tag className="w-3 h-3 text-primary/60" />;
      if (reason.includes('Frequently')) return <TrendingUp className="w-3 h-3 text-primary/60" />;
      if (reason.includes('Recently')) return <Clock className="w-3 h-3 text-primary/60" />;
      if (reason.includes('time')) return <Calendar className="w-3 h-3 text-primary/60" />;
      return <Sparkles className="w-3 h-3 text-primary/60" />;
    };

    return (
      <>
        <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5 border-b flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          SMART SUGGESTIONS
        </div>
        {suggestions.map((suggestion, index) => (
          <SelectItem
            key={`smart-${suggestion.categoryId}`}
            value={suggestion.categoryId}
            className="flex items-center justify-between px-3 py-2 bg-primary/5 hover:bg-primary/10"
          >
            <div className="flex items-center flex-1">
              <span 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                style={{ backgroundColor: suggestion.category.color }}
              />
              <div className="flex flex-col flex-1">
                <span className="font-medium text-sm">{suggestion.category.name}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getReasonIcon(suggestion.reasons[0])}
                  <span>{suggestion.reasons[0]}</span>
                  <span className="ml-auto text-primary font-medium">
                    {Math.round(suggestion.confidence)}%
                  </span>
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
        <div className="h-px bg-border my-1" />
      </>
    );
  };

  // Render categories simply by group
  const renderCategories = () => {
    return (
      <>
        {groupedCategories.needs.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400">
              NEEDS (Essential)
            </div>
            {groupedCategories.needs.map((category) => (
              <SelectItem key={category.id} value={category.id} className="pl-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </>
        )}
        
        {groupedCategories.wants.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400">
              WANTS (Discretionary)
            </div>
            {groupedCategories.wants.map((category) => (
              <SelectItem key={category.id} value={category.id} className="pl-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </>
        )}
        
        {groupedCategories.savings.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400">
              SAVINGS & INVESTMENTS
            </div>
            {groupedCategories.savings.map((category) => (
              <SelectItem key={category.id} value={category.id} className="pl-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </>
        )}
        
        {groupedCategories.other.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400">
              OTHER
            </div>
            {groupedCategories.other.map((category) => (
              <SelectItem key={category.id} value={category.id} className="pl-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </>
        )}
        
        {allCategories.length === 0 && (
          <>
            {renderHierarchicalDemoCategories()}
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
        <SelectContent className="bg-background border-border max-h-80 overflow-y-auto z-50">
          {includeAllOption && (
            <>
              <SelectItem value="all" className="font-medium">
                All Categories
              </SelectItem>
              <div className="h-px bg-border my-1" />
            </>
          )}
          
          {renderSmartSuggestions()}
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
