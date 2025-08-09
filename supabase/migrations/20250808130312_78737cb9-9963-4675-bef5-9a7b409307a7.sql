-- Create income_sources table
CREATE TABLE public.income_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'fortnightly', 'monthly', 'yearly')),
  amount_ttd NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_categories table
CREATE TABLE public.budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('needs', 'wants', 'savings')),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_allocations table (rules like 50/30/20)
CREATE TABLE public.budget_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  needs_pct NUMERIC NOT NULL DEFAULT 50,
  wants_pct NUMERIC NOT NULL DEFAULT 30,
  savings_pct NUMERIC NOT NULL DEFAULT 20,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_scenarios table
CREATE TABLE public.budget_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  delta_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_periods table
CREATE TABLE public.budget_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL, -- First day of month
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_expenses NUMERIC NOT NULL DEFAULT 0,
  surplus NUMERIC NOT NULL DEFAULT 0,
  rule_applied TEXT,
  snapshot_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Add budget_category_id to expenses table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expenses' AND column_name = 'budget_category_id') THEN
        ALTER TABLE public.expenses ADD COLUMN budget_category_id UUID;
    END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for income_sources
CREATE POLICY "Users can manage their own income sources" 
ON public.income_sources 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for budget_categories
CREATE POLICY "Users can manage their own budget categories" 
ON public.budget_categories 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for budget_allocations
CREATE POLICY "Users can manage their own budget allocations" 
ON public.budget_allocations 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for budget_scenarios
CREATE POLICY "Users can manage their own budget scenarios" 
ON public.budget_scenarios 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for budget_periods
CREATE POLICY "Users can manage their own budget periods" 
ON public.budget_periods 
FOR ALL 
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_income_sources_updated_at
BEFORE UPDATE ON public.income_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at
BEFORE UPDATE ON public.budget_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_allocations_updated_at
BEFORE UPDATE ON public.budget_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_scenarios_updated_at
BEFORE UPDATE ON public.budget_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_periods_updated_at
BEFORE UPDATE ON public.budget_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default budget categories for new users
-- This could be called from a trigger or application logic
CREATE OR REPLACE FUNCTION public.create_default_budget_categories(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert default needs categories
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'Care', 1),
  (user_uuid, 'needs', 'Groceries', 2),
  (user_uuid, 'needs', 'Gas/Fuel', 3),
  (user_uuid, 'needs', 'Medication', 4),
  (user_uuid, 'needs', 'School Fees', 5),
  (user_uuid, 'needs', 'Yard', 6),
  (user_uuid, 'needs', 'Transport', 7),
  (user_uuid, 'needs', 'Insurance', 8),
  (user_uuid, 'needs', 'Minimum Debt', 9);

  -- Insert default wants categories
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'wants', 'Dining Out', 1),
  (user_uuid, 'wants', 'Entertainment', 2),
  (user_uuid, 'wants', 'Subscriptions', 3),
  (user_uuid, 'wants', 'Personal Care', 4),
  (user_uuid, 'wants', 'Travel', 5);

  -- Insert default savings categories
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'savings', 'Emergency Fund', 1),
  (user_uuid, 'savings', 'Investments', 2),
  (user_uuid, 'savings', 'Retirement', 3),
  (user_uuid, 'savings', 'Extra Debt Payments', 4);

  -- Insert default 50/30/20 rule
  INSERT INTO public.budget_allocations (user_id, rule_name, needs_pct, wants_pct, savings_pct, is_default)
  VALUES (user_uuid, '50/30/20 Rule', 50, 30, 20, true);
END;
$$;