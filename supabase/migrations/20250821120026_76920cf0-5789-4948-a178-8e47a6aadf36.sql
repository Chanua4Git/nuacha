-- Add family_id to income_sources table
ALTER TABLE public.income_sources 
ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;

-- Add family_id to budget_templates table  
ALTER TABLE public.budget_templates
ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;

-- Update RLS policies for income_sources to be family-aware
DROP POLICY IF EXISTS "Users can manage their own income sources" ON public.income_sources;

CREATE POLICY "Users can manage their family income sources" 
ON public.income_sources 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.families f 
    WHERE f.id = income_sources.family_id 
    AND f.user_id = auth.uid()
  )
);

-- Update RLS policies for budget_templates to be family-aware
DROP POLICY IF EXISTS "Users can manage their own budget templates" ON public.budget_templates;

CREATE POLICY "Users can manage their family budget templates" 
ON public.budget_templates 
FOR ALL
USING (
  (family_id IS NULL AND user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.families f 
    WHERE f.id = budget_templates.family_id 
    AND f.user_id = auth.uid()
  )
);

-- Migrate existing data: assign income sources to first family of each user
UPDATE public.income_sources 
SET family_id = (
  SELECT f.id 
  FROM public.families f 
  WHERE f.user_id = income_sources.user_id 
  ORDER BY f.created_at ASC 
  LIMIT 1
)
WHERE family_id IS NULL;

-- Migrate existing budget templates to first family of each user  
UPDATE public.budget_templates
SET family_id = (
  SELECT f.id 
  FROM public.families f 
  WHERE f.user_id = budget_templates.user_id 
  ORDER BY f.created_at ASC 
  LIMIT 1
)
WHERE family_id IS NULL;