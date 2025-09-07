import React from 'react';
import ExpenseList from '@/components/ExpenseList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useDemoExpense } from './DemoExpenseContext';

const DemoAwareExpenseList = () => {
  const { expenses, clearDemoData } = useDemoExpense();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Alert className="flex-1 mr-4">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Demo mode - Your expenses are temporarily stored. 
            <Button variant="link" className="p-0 h-auto font-medium" asChild>
              <Link to="/signup">Sign up to save permanently</Link>
            </Button>
          </AlertDescription>
        </Alert>
        
        {expenses.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearDemoData}
            className="whitespace-nowrap"
          >
            Clear Demo Data
          </Button>
        )}
      </div>
      
      <ExpenseList />
      
      {expenses.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="text-muted-foreground">
            <p className="text-lg">No expenses yet in your demo</p>
            <p>Add your first expense to see how Nuacha works</p>
          </div>
          <Button asChild>
            <Link to="/demo?tab=add-expense">Add Your First Expense</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default DemoAwareExpenseList;