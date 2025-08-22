import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { CategoryWithChildren } from '@/hooks/useCategories';

interface CategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  familyId: string;
  placeholder?: string;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onValueChange,
  familyId,
  placeholder = "Select category...",
  className
}) => {
  // Only fetch family-specific categories, exclude general/budget categories
  const { categories, hierarchicalCategories, isLoading } = useCategories(familyId, false);

  // Client-side deduplication by name (case-insensitive) - keep the first occurrence
  const deduplicatedCategories = React.useMemo(() => {
    const seen = new Set<string>();
    const uniqueCategories: CategoryWithChildren[] = [];
    
    hierarchicalCategories.forEach(category => {
      const nameLower = category.name.toLowerCase();
      if (!seen.has(nameLower)) {
        seen.add(nameLower);
        uniqueCategories.push(category);
      }
    });
    
    return uniqueCategories;
  }, [hierarchicalCategories]);

  const renderCategoryOption = (category: CategoryWithChildren, level: number = 0) => {
    const indent = '  '.repeat(level);
    const displayName = `${indent}${category.name}`;
    
    return (
      <React.Fragment key={category.id}>
        <SelectItem value={category.name} className={level > 0 ? "pl-6" : ""}>
          {displayName}
        </SelectItem>
        {category.children?.map(child => renderCategoryOption(child, level + 1))}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading categories..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {deduplicatedCategories.length === 0 ? (
          <SelectItem value="" disabled>
            No categories available
          </SelectItem>
        ) : (
          deduplicatedCategories.map(category => renderCategoryOption(category))
        )}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;
