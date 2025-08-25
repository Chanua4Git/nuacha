-- Fix category group types for Trinidad & Tobago users
-- Move entertainment, dining, shopping categories from 'needs' to 'wants'
-- Move savings-related categories to 'savings'

UPDATE categories 
SET group_type = 'wants'
WHERE group_type = 'needs' 
AND (
  LOWER(name) LIKE '%dining%' OR
  LOWER(name) LIKE '%restaurant%' OR
  LOWER(name) LIKE '%cafe%' OR
  LOWER(name) LIKE '%entertainment%' OR
  LOWER(name) LIKE '%leisure%' OR
  LOWER(name) LIKE '%hobby%' OR
  LOWER(name) LIKE '%gift%' OR
  LOWER(name) LIKE '%celebration%' OR
  LOWER(name) LIKE '%party%' OR
  LOWER(name) LIKE '%vacation%' OR
  LOWER(name) LIKE '%travel%' OR
  LOWER(name) LIKE '%shopping%' OR
  LOWER(name) LIKE '%clothes%' OR
  LOWER(name) LIKE '%clothing%' OR
  LOWER(name) LIKE '%beauty%' OR
  LOWER(name) LIKE '%spa%' OR
  LOWER(name) LIKE '%massage%' OR
  LOWER(name) LIKE '%gym%' OR
  LOWER(name) LIKE '%fitness%' OR
  LOWER(name) LIKE '%subscription%' OR
  LOWER(name) LIKE '%streaming%' OR
  LOWER(name) LIKE '%cable%' OR
  name IN ('Outings', 'Holidays', 'Toys/Games/Sports', 'Presents', 'Activities & Well-being', 'Hairdressing')
);

UPDATE categories 
SET group_type = 'savings'
WHERE group_type = 'needs' 
AND (
  LOWER(name) LIKE '%saving%' OR
  LOWER(name) LIKE '%investment%' OR
  LOWER(name) LIKE '%emergency%' OR
  name IN ('Emergency Fund')
);

-- Add 'Dining out' category if it doesn't exist
INSERT INTO categories (name, color, group_type, family_id, user_id)
SELECT 'Dining out', '#F97316', 'wants', f.id, f.user_id
FROM families f
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.family_id = f.id 
  AND LOWER(c.name) = 'dining out'
);