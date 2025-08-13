import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, TrendingUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExpenseType = 'actual' | 'planned' | 'budgeted';

interface ExpenseTypeFilterProps {
  selectedTypes: ExpenseType[];
  onChange: (types: ExpenseType[]) => void;
  showAll?: boolean;
}

const ExpenseTypeFilter = ({ selectedTypes, onChange, showAll = true }: ExpenseTypeFilterProps) => {
  const types = [
    {
      id: 'actual' as ExpenseType,
      label: 'Actual',
      icon: CheckCircle,
      color: 'text-green-700 border-green-200 hover:bg-green-50',
      activeColor: 'bg-green-100 border-green-300 text-green-800'
    },
    {
      id: 'planned' as ExpenseType,
      label: 'Planned',
      icon: Clock,
      color: 'text-yellow-700 border-yellow-200 hover:bg-yellow-50',
      activeColor: 'bg-yellow-100 border-yellow-300 text-yellow-800'
    },
    {
      id: 'budgeted' as ExpenseType,
      label: 'Budgeted',
      icon: TrendingUp,
      color: 'text-blue-700 border-blue-200 hover:bg-blue-50',
      activeColor: 'bg-blue-100 border-blue-300 text-blue-800'
    }
  ];

  const toggleType = (type: ExpenseType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter(t => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  const toggleAll = () => {
    if (selectedTypes.length === types.length) {
      onChange([]);
    } else {
      onChange(types.map(t => t.id));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">Type:</span>
      
      {showAll && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAll}
          className={cn(
            "text-xs",
            selectedTypes.length === types.length
              ? "bg-muted text-muted-foreground"
              : "hover:bg-muted"
          )}
        >
          All
        </Button>
      )}
      
      {types.map((type) => {
        const Icon = type.icon;
        const isActive = selectedTypes.includes(type.id);
        
        return (
          <Button
            key={type.id}
            variant="outline"
            size="sm"
            onClick={() => toggleType(type.id)}
            className={cn(
              "text-xs",
              isActive ? type.activeColor : type.color
            )}
          >
            <Icon className="w-3 h-3 mr-1" />
            {type.label}
          </Button>
        );
      })}
    </div>
  );
};

export default ExpenseTypeFilter;