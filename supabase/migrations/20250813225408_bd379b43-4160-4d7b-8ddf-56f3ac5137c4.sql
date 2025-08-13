-- Add expense_type column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN expense_type text NOT NULL DEFAULT 'actual';

-- Add check constraint for valid expense types
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_expense_type_check 
CHECK (expense_type IN ('actual', 'planned', 'budgeted'));

-- Create index for better performance on expense_type queries
CREATE INDEX idx_expenses_expense_type ON public.expenses(expense_type);

-- Update existing expenses to have 'actual' type (they're all real expenses)
UPDATE public.expenses SET expense_type = 'actual' WHERE expense_type IS NULL;