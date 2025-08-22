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
  // Fetch both family-specific AND budget categories for full categorization
  const { categories, hierarchicalCategories, isLoading } = useCategories(familyId, true);

  // Group categories by groupType and sort alphabetically within groups
  const groupedCategories = React.useMemo(() => {
    const seen = new Set<string>();
    const uniqueCategories: CategoryWithChildren[] = [];
    
    // First deduplicate by name (case-insensitive)
    hierarchicalCategories.forEach(category => {
      const nameLower = category.name.toLowerCase();
      if (!seen.has(nameLower)) {
        seen.add(nameLower);
        uniqueCategories.push(category);
      }
    });
    
    // Group by groupType and sort alphabetically within each group
    const groups = {
      needs: uniqueCategories.filter(cat => cat.groupType === 'needs').sort((a, b) => a.name.localeCompare(b.name)),
      wants: uniqueCategories.filter(cat => cat.groupType === 'wants').sort((a, b) => a.name.localeCompare(b.name)),
      savings: uniqueCategories.filter(cat => cat.groupType === 'savings').sort((a, b) => a.name.localeCompare(b.name)),
      other: uniqueCategories.filter(cat => !cat.groupType || !['needs', 'wants', 'savings'].includes(cat.groupType)).sort((a, b) => a.name.localeCompare(b.name))
    };
    
    return groups;
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

  const renderGroup = (title: string, categories: CategoryWithChildren[], colorClass: string) => {
    if (categories.length === 0) return null;
    
    return (
      <React.Fragment key={title}>
        <SelectItem value={`__header_${title}`} disabled className={`font-semibold text-sm ${colorClass} opacity-70 cursor-default`}>
          {title.toUpperCase()}
        </SelectItem>
        {categories.map(category => renderCategoryOption(category))}
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
        {Object.values(groupedCategories).every(group => group.length === 0) ? (
          <SelectItem value="" disabled>
            No categories available
          </SelectItem>
        ) : (
          <>
            {renderGroup('Needs', groupedCategories.needs, 'text-red-600')}
            {renderGroup('Wants', groupedCategories.wants, 'text-orange-600')}
            {renderGroup('Savings', groupedCategories.savings, 'text-green-600')}
            {renderGroup('Other', groupedCategories.other, 'text-gray-600')}
          </>
        )}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;
