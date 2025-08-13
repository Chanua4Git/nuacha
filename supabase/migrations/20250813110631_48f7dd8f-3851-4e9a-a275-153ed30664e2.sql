-- Phase 1: Update existing categories with budget properties
-- First, add default group_type, user_id, and sort_order to existing categories

-- Update existing family categories to be in the 'needs' group by default
-- and assign them to the family's user
UPDATE public.categories 
SET 
  group_type = 'needs',
  user_id = (
    SELECT f.user_id 
    FROM public.families f 
    WHERE f.id = categories.family_id
  ),
  sort_order = COALESCE(sort_order, 0)
WHERE family_id IS NOT NULL 
  AND group_type IS NULL;

-- Update color schemes for better consistency with demo categories
-- Common categories mapping to proper colors from comprehensiveCategories.ts
UPDATE public.categories 
SET color = CASE 
  WHEN name ILIKE '%groceries%' OR name ILIKE '%food%' THEN '#22C55E'
  WHEN name ILIKE '%medical%' OR name ILIKE '%health%' OR name ILIKE '%doctor%' THEN '#EF4444'
  WHEN name ILIKE '%school%' OR name ILIKE '%education%' OR name ILIKE '%child%' THEN '#8B5CF6'
  WHEN name ILIKE '%transport%' OR name ILIKE '%fuel%' OR name ILIKE '%car%' THEN '#F97316'
  WHEN name ILIKE '%utilities%' OR name ILIKE '%electric%' OR name ILIKE '%water%' THEN '#0EA5E9'
  WHEN name ILIKE '%entertainment%' OR name ILIKE '%dining%' OR name ILIKE '%leisure%' THEN '#F59E0B'
  WHEN name ILIKE '%gift%' OR name ILIKE '%celebration%' THEN '#EF4444'
  WHEN name ILIKE '%travel%' OR name ILIKE '%holiday%' THEN '#06B6D4'
  WHEN name ILIKE '%personal%' OR name ILIKE '%care%' OR name ILIKE '%beauty%' THEN '#EC4899'
  WHEN name ILIKE '%household%' OR name ILIKE '%cleaning%' OR name ILIKE '%maintenance%' THEN '#10B981'
  WHEN name ILIKE '%insurance%' OR name ILIKE '%financial%' OR name ILIKE '%saving%' THEN '#6366F1'
  ELSE color
END
WHERE color = '#64748B' OR color = '#6B7280' OR color IS NULL;

-- Set proper group_type based on category names for better categorization
UPDATE public.categories 
SET group_type = CASE
  -- Needs: Essential categories
  WHEN name ILIKE '%rent%' OR name ILIKE '%mortgage%' OR name ILIKE '%utilities%' 
    OR name ILIKE '%groceries%' OR name ILIKE '%medical%' OR name ILIKE '%school fees%'
    OR name ILIKE '%insurance%' OR name ILIKE '%fuel%' OR name ILIKE '%child%' 
    OR name ILIKE '%electricity%' OR name ILIKE '%water%' OR name ILIKE '%gas%'
    OR name ILIKE '%doctor%' OR name ILIKE '%medication%' OR name ILIKE '%emergency%'
    THEN 'needs'
  
  -- Savings: Investment and saving related
  WHEN name ILIKE '%saving%' OR name ILIKE '%investment%' OR name ILIKE '%pension%'
    THEN 'savings'
  
  -- Wants: Everything else (entertainment, dining out, etc.)
  WHEN name ILIKE '%entertainment%' OR name ILIKE '%dining%' OR name ILIKE '%travel%'
    OR name ILIKE '%gift%' OR name ILIKE '%hobby%' OR name ILIKE '%spa%' 
    OR name ILIKE '%subscription%' OR name ILIKE '%luxury%' OR name ILIKE '%leisure%'
    THEN 'wants'
  
  -- Default to 'needs' for unmatched categories (safer default)
  ELSE 'needs'
END
WHERE group_type IS NULL;