
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { Tag } from 'lucide-react';
import { CategoryWithCamelCase } from '@/types/expense';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  suggestedCategoryId?: string;
}

const CategorySelector = ({ value, onChange, className, suggestedCategoryId }: CategorySelectorProps) => {
  const { categories, selectedFamily } = useExpense();
  
  // Filter categories to show general ones + those for the selected family
  const availableCategories = categories.filter(cat => 
    (cat.id && cat.id !== '') && (!cat.family_id || (selectedFamily && cat.family_id === selectedFamily.id))
  );
  
  const getCategory = (id: string): CategoryWithCamelCase | undefined => 
    categories.find(c => c.id === id);
  
  const selectedCategory = value ? getCategory(value) : undefined;
  const suggestedCategory = suggestedCategoryId ? getCategory(suggestedCategoryId) : undefined;

  // Use suggested category if available and no category is selected
  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
  };

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center mb-2">
        <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
        <label className="text-sm font-medium">Category</label>
      </div>
      <Select
        value={value || undefined}
        onValueChange={handleSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a category">
            {selectedCategory && (
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: selectedCategory.color }}
                />
                {selectedCategory.name}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50">
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
          
          {availableCategories.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No categories available. Please create categories first.
            </div>
          ) : (
            availableCategories.map((category) => (
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
            ))
          )}
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
