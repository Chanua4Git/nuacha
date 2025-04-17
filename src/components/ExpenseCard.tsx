
import { Card, CardContent } from '@/components/ui/card';
import { Expense } from '@/data/mockData';
import { format, parseISO } from 'date-fns';
import { useExpense } from '@/context/ExpenseContext';
import { DollarSign, Calendar, MapPin, TagIcon } from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense;
}

const ExpenseCard = ({ expense }: ExpenseCardProps) => {
  const { categories } = useExpense();
  
  const category = categories.find(c => c.id === expense.category);
  
  return (
    <Card className="mb-4 overflow-hidden">
      <div 
        className="h-2" 
        style={{ backgroundColor: category?.color || '#CBD5E1' }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{expense.description}</h3>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span>{expense.place}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${expense.amount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              {format(parseISO(expense.date), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center mt-3">
          <div 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs"
            style={{ 
              backgroundColor: `${category?.color}15`,
              color: category?.color
            }}
          >
            <TagIcon className="h-3 w-3 mr-1" />
            {category?.name || 'Uncategorized'}
          </div>
          
          {expense.needsReplacement && (
            <div className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              <Calendar className="h-3 w-3 mr-1" />
              Next: {format(parseISO(expense.nextReplacementDate || ''), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCard;
