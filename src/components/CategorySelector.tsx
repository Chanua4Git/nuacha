
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const { categories, isLoading: categoriesLoading } = useCategories(selectedFamily?.id);
  
  // Filter categories to show general ones + those for the selected family
  const availableCategories = categories.filter(cat => 
    (cat.id && cat.id !== '') && (!cat.familyId || (selectedFamily && cat.familyId === selectedFamily.id))
  );
  
  const getCategory = (id: string): CategoryWithCamelCase | undefined => 
    categories.find(c => c.id === id);
  
  const selectedCategory = value ? getCategory(value) : undefined;
  const suggestedCategory = suggestedCategoryId ? getCategory(suggestedCategoryId) : undefined;

  // Use suggested category if available and no category is selected
  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
  };

  // Handle cases when we're in demo mode and might not have categories
  const renderCategories = () => {
    if (availableCategories.length === 0) {
      // Demo categories for use when no categories are available
      const demoCategories = [
        { id: 'demo-groceries', name: 'Groceries', color: '#4CAF50' },
        { id: 'demo-utilities', name: 'Utilities', color: '#2196F3' },
        { id: 'demo-dining', name: 'Dining Out', color: '#FF9800' },
        { id: 'demo-transport', name: 'Transportation', color: '#795548' },
        { id: 'demo-shopping', name: 'Shopping', color: '#E91E63' },
      ];
      
      return demoCategories.map((category) => (
        <SelectItem 
          key={category.id} 
          value={category.id}
          className="flex items-center"
        >
          <div className="flex items-center">
            <span 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </div>
        </SelectItem>
      ));
    }
    
    // Use real categories if available
    return availableCategories.map((category) => (
      <SelectItem 
        key={category.id} 
        value={category.id}
        className="flex items-center"
      >
        <div className="flex items-center">
          <span 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: category.color }}
          />
          {category.name}
        </div>
      </SelectItem>
    ));
  };

  // Handle selected category display for demo modes
  const renderSelectedCategory = () => {
    if (selectedCategory) {
      return (
        <div className="flex items-center">
          <span 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: selectedCategory.color }}
          />
          {selectedCategory.name}
        </div>
      );
    }
    
    // Demo mode - check if we have a value but no matching category
    if (value && value.startsWith('demo-')) {
      const demoCategories = {
        'demo-groceries': { name: 'Groceries', color: '#4CAF50' },
        'demo-utilities': { name: 'Utilities', color: '#2196F3' },
        'demo-dining': { name: 'Dining Out', color: '#FF9800' },
        'demo-transport': { name: 'Transportation', color: '#795548' },
        'demo-shopping': { name: 'Shopping', color: '#E91E63' },
      };
      
      const demoCategory = demoCategories[value as keyof typeof demoCategories];
      
      if (demoCategory) {
        return (
          <div className="flex items-center">
            <span 
              className="w-3 h-3 rounded-full mr-2" 
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
        {categoriesLoading && (
          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
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
        <SelectContent className="z-50">
          {includeAllOption && (
            <SelectItem value="all_categories">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2 bg-gray-300" />
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
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: suggestedCategory.color }}
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
