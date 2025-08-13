import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';

export type ExpenseType = 'actual' | 'planned' | 'budgeted';

interface ExpenseTypeSelectorProps {
  value: ExpenseType;
  onChange: (type: ExpenseType) => void;
}

const ExpenseTypeSelector = ({ value, onChange }: ExpenseTypeSelectorProps) => {
  const types = [
    {
      id: 'actual' as ExpenseType,
      label: 'Actual',
      description: 'Real transaction',
      icon: CheckCircle,
      color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
      activeColor: 'bg-green-100 border-green-300 text-green-800'
    },
    {
      id: 'planned' as ExpenseType,
      label: 'Planned',
      description: 'Future expense',
      icon: Clock,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
      activeColor: 'bg-yellow-100 border-yellow-300 text-yellow-800'
    },
    {
      id: 'budgeted' as ExpenseType,
      label: 'Budgeted',
      description: 'Budget planning',
      icon: TrendingUp,
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
      activeColor: 'bg-blue-100 border-blue-300 text-blue-800'
    }
  ];

  return (
    <div className="space-y-2">
      <Label>Expense Type</Label>
      <div className="grid grid-cols-3 gap-2">
        {types.map((type) => {
          const Icon = type.icon;
          const isActive = value === type.id;
          
          return (
            <Button
              key={type.id}
              type="button"
              variant="outline"
              onClick={() => onChange(type.id)}
              className={cn(
                "h-auto p-3 flex flex-col items-center gap-1 text-center",
                isActive ? type.activeColor : type.color
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{type.label}</span>
              <span className="text-xs opacity-75">{type.description}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ExpenseTypeSelector;