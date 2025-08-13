-- Update existing family categories to be budget categories
UPDATE categories 
SET is_budget_category = true,
    group_type = CASE 
      WHEN name ILIKE '%childcare%' OR name ILIKE '%school%' OR name ILIKE '%medical%' OR name ILIKE '%doctor%' OR name ILIKE '%health%' OR name ILIKE '%insurance%' OR name ILIKE '%rent%' OR name ILIKE '%mortgage%' OR name ILIKE '%utilities%' OR name ILIKE '%groceries%' OR name ILIKE '%food%' OR name ILIKE '%transport%' OR name ILIKE '%fuel%' OR name ILIKE '%electric%' OR name ILIKE '%water%' OR name ILIKE '%gas%' THEN 'needs'
      WHEN name ILIKE '%entertainment%' OR name ILIKE '%dining%' OR name ILIKE '%hobby%' OR name ILIKE '%spa%' OR name ILIKE '%gym%' OR name ILIKE '%vacation%' OR name ILIKE '%gift%' OR name ILIKE '%clothes%' OR name ILIKE '%shopping%' THEN 'wants'
      WHEN name ILIKE '%savings%' OR name ILIKE '%investment%' OR name ILIKE '%retirement%' THEN 'savings'
      ELSE 'needs'
    END
WHERE family_id IS NOT NULL 
  AND group_type IS NULL;