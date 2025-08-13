import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExpenseType = 'actual' | 'planned' | 'budgeted';

interface ExpenseTypeBadgeProps {
  type: ExpenseType;
  size?: 'sm' | 'default';
}

const ExpenseTypeBadge = ({ type, size = 'default' }: ExpenseTypeBadgeProps) => {
  const config = {
    actual: {
      label: 'Actual',
      icon: CheckCircle,
      className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
    },
    planned: {
      label: 'Planned',
      icon: Clock,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
    },
    budgeted: {
      label: 'Budgeted',
      icon: TrendingUp,
      className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    }
  };

  const { label, icon: Icon, className } = config[type];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        className,
        size === 'sm' && 'text-xs px-1.5 py-0.5'
      )}
    >
      <Icon className={cn(
        size === 'sm' ? 'w-3 h-3 mr-1' : 'w-3 h-3 mr-1'
      )} />
      {label}
    </Badge>
  );
};

export default ExpenseTypeBadge;