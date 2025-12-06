-- Create table for tracking monthly recurring payments
CREATE TABLE public.monthly_recurring_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.budget_templates(id) ON DELETE SET NULL,
  category_key TEXT NOT NULL,
  category_name TEXT NOT NULL,
  group_type TEXT NOT NULL DEFAULT 'needs',
  month DATE NOT NULL,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  actual_paid NUMERIC,
  payment_date DATE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, family_id, category_key, month)
);

-- Enable Row Level Security
ALTER TABLE public.monthly_recurring_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own recurring payments"
ON public.monthly_recurring_payments
FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_recurring_payments_user_month ON public.monthly_recurring_payments(user_id, month);
CREATE INDEX idx_recurring_payments_family_month ON public.monthly_recurring_payments(family_id, month);

-- Create trigger for updated_at
CREATE TRIGGER update_recurring_payments_updated_at
BEFORE UPDATE ON public.monthly_recurring_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();