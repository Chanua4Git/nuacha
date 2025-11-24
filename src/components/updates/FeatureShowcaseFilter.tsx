import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
}

interface FeatureShowcaseFilterProps {
  title: string;
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

export function FeatureShowcaseFilter({
  title,
  options,
  activeFilter,
  onFilterChange,
}: FeatureShowcaseFilterProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {options.map((option) => (
          <Badge
            key={option.id}
            variant={activeFilter === option.id ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-all h-8',
              activeFilter === option.id
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:bg-accent/50'
            )}
            onClick={() => onFilterChange(option.id)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
