-- Fix SAHM family expense mappings to correct budget categories
-- Get the correct SAHM family ID first
UPDATE expenses SET budget_category_id = (
  SELECT c.id FROM categories c 
  WHERE c.family_id = expenses.family_id 
  AND c.is_budget_category = true 
  AND c.name = 'Childcare'
  LIMIT 1
)
WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d' 
AND description LIKE '%Childcare%';

-- Map cooking expenses to appropriate food/household category
UPDATE expenses SET budget_category_id = (
  SELECT c.id FROM categories c 
  WHERE c.family_id = expenses.family_id 
  AND c.is_budget_category = true 
  AND c.name = 'Groceries'
  LIMIT 1
)
WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d' 
AND description LIKE '%Cooking%';

-- Map cleaning/housekeeping expenses  
UPDATE expenses SET budget_category_id = (
  SELECT c.id FROM categories c 
  WHERE c.family_id = expenses.family_id 
  AND c.is_budget_category = true 
  AND c.name = 'Housekeeper'
  LIMIT 1
)
WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d' 
AND description LIKE '%Cleaning%';

-- Map tutoring to education category
UPDATE expenses SET budget_category_id = (
  SELECT c.id FROM categories c 
  WHERE c.family_id = expenses.family_id 
  AND c.is_budget_category = true 
  AND c.name = 'School fees'
  LIMIT 1
)
WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d' 
AND description LIKE '%Tutoring%';

-- Map laundry to household operations
UPDATE expenses SET budget_category_id = (
  SELECT c.id FROM categories c 
  WHERE c.family_id = expenses.family_id 
  AND c.is_budget_category = true 
  AND c.name = 'Laundry'
  LIMIT 1
)
WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d' 
AND description LIKE '%Laundry%';

-- Map transport to transportation category
UPDATE expenses SET budget_category_id = (
  SELECT c.id FROM categories c 
  WHERE c.family_id = expenses.family_id 
  AND c.is_budget_category = true 
  AND c.name = 'Transportation'
  LIMIT 1
)
WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d' 
AND description LIKE '%Transport%';

-- Map remaining expenses to appropriate categories or create fallback
UPDATE expenses SET budget_category_id = (
  SELECT c.id FROM categories c 
  WHERE c.family_id = expenses.family_id 
  AND c.is_budget_category = true 
  AND c.group_type = 'needs'
  ORDER BY c.name
  LIMIT 1
)
WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d' 
AND (budget_category_id IS NULL OR budget_category_id NOT IN (
  SELECT id FROM categories WHERE family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d'
));