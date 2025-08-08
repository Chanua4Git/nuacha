-- Update the existing JTA Supermarkets expense to have the correct budget category
UPDATE expenses 
SET budget_category_id = (
  SELECT id 
  FROM budget_categories 
  WHERE name = 'Groceries' 
    AND group_type = 'needs' 
    AND user_id = '27182ba6-fe5d-431e-9302-c0c7e71597c0' 
  LIMIT 1
) 
WHERE description LIKE '%JTA%' 
  AND budget_category_id IS NULL;