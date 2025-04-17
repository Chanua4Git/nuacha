
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { Tag } from 'lucide-react';
import { Category } from '@/data/mockData';

interface CategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const CategorySelector = ({ value, onChange }: CategorySelectorProps) => {
  const { categories, selectedFamily } = useExpense();
  
  // Filter categories to show general ones + those for the selected family
  const availableCategories = categories.filter(cat => 
    !cat.familyId || (selectedFamily && cat.familyId === selectedFamily.id)
  );
  
  const getCategory = (id: string): Category | undefined => 
    categories.find(c => c.id === id);
  
  const selectedCategory = value ? getCategory(value) : undefined;

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
        <label className="text-sm font-medium">Category</label>
      </div>
      <Select
        value={value}
        onValueChange={onChange}
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
        <SelectContent>
          {availableCategories.map((category) => (
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
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
