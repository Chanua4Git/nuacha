
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense } from '@/types/expense';
import { format, parseISO } from 'date-fns';
import { useExpense } from '@/context/ExpenseContext';
import { DollarSign, Calendar, MapPin, TagIcon, Trash2, Edit, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExpenseTypeBadge from './ExpenseTypeBadge';
import { DriveLinkButton } from './DriveLinkButton';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  onViewDetails?: (expense: Expense) => void;
  onCategoryChange?: (expenseId: string, categoryId: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (expenseId: string, selected: boolean) => void;
  showBulkSelect?: boolean;
  isDuplicate?: boolean;
  duplicateConfidence?: number;
}

const ExpenseCard = ({ 
  expense, 
  onEdit, 
  onDelete, 
  onViewDetails,
  onCategoryChange,
  isSelected = false, 
  onSelectionChange, 
  showBulkSelect = false,
  isDuplicate = false,
  duplicateConfidence
}: ExpenseCardProps) => {
  const { categories } = useExpense();
  
  const category = categories.find(c => c.id === expense.category);
  const hasReceipt = !!expense.receiptImageUrl || !!expense.receiptUrl;

  const handleCategoryChange = (categoryId: string) => {
    if (onCategoryChange && categoryId !== expense.category) {
      onCategoryChange(expense.id, categoryId === 'none' ? '' : categoryId);
    }
  };
  
  return (
    <Card className={cn("mb-4 overflow-hidden", isDuplicate && "border-orange-200 bg-orange-50")}>
      <div 
        className="h-2" 
        style={{ backgroundColor: category?.color || '#CBD5E1' }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {showBulkSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange?.(expense.id, checked as boolean)}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{expense.description}</h3>
                {isDuplicate && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Duplicate {duplicateConfidence && `(${duplicateConfidence}%)`}
                  </Badge>
                )}
              </div>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{expense.place}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex items-start gap-2">
            <div>
              <div className="text-lg font-bold">${expense.amount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {format(parseISO(expense.date), 'MMM d, yyyy')}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(expense)}
                  className="h-8 w-8 p-0"
                  title="View receipt details"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(expense)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(expense.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center mt-3 gap-2 flex-wrap">
          {onCategoryChange ? (
            <Select
              value={expense.category || 'none'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="h-7 w-auto min-w-[140px] text-xs">
                <SelectValue>
                  <span className="flex items-center gap-1">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category?.color || '#CBD5E1' }}
                    />
                    {category?.name || 'Uncategorized'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: cat.color || '#888' }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
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
          )}
          
          <ExpenseTypeBadge 
            type={expense.expenseType || 'actual'} 
            size="sm" 
          />
          
          {hasReceipt && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Has Receipt
            </Badge>
          )}
          
          {expense.needsReplacement && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              <Calendar className="h-3 w-3 mr-1" />
              Next: {format(parseISO(expense.nextReplacementDate || ''), 'MMM d, yyyy')}
            </div>
          )}
          
          <DriveLinkButton driveUrl={expense.driveUrl} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCard;
