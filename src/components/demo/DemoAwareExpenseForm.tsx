import React from 'react';
import ExpenseForm from '@/components/expense-form/ExpenseForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const DemoAwareExpenseForm = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You're in demo mode. Your expenses are saved locally and won't persist between sessions. 
          Sign up to save your data permanently.
        </AlertDescription>
      </Alert>
      
      <ExpenseForm />
    </div>
  );
};

export default DemoAwareExpenseForm;