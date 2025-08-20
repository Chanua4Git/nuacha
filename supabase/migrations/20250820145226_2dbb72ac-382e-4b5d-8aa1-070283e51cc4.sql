-- Create budget_templates table to store planned budget amounts
CREATE TABLE public.budget_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Budget Template',
  description TEXT,
  total_monthly_income NUMERIC NOT NULL DEFAULT 0,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_templates
CREATE POLICY "Users can manage their own budget templates" 
ON public.budget_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_budget_templates_updated_at
BEFORE UPDATE ON public.budget_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();