-- Add CASCADE delete to all foreign keys referencing families table
-- This ensures when a family is deleted, all related data is automatically removed

-- Expenses
ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_family_id_fkey,
ADD CONSTRAINT expenses_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

-- Family Members
ALTER TABLE family_members 
DROP CONSTRAINT IF EXISTS family_members_family_id_fkey,
ADD CONSTRAINT family_members_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

-- Categories
ALTER TABLE categories 
DROP CONSTRAINT IF EXISTS categories_family_id_fkey,
ADD CONSTRAINT categories_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

-- Reminders
ALTER TABLE reminders 
DROP CONSTRAINT IF EXISTS reminders_family_id_fkey,
ADD CONSTRAINT reminders_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

-- Budgets
ALTER TABLE budgets 
DROP CONSTRAINT IF EXISTS budgets_family_id_fkey,
ADD CONSTRAINT budgets_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

-- Budget Templates
ALTER TABLE budget_templates 
DROP CONSTRAINT IF EXISTS budget_templates_family_id_fkey,
ADD CONSTRAINT budget_templates_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;

-- Income Sources
ALTER TABLE income_sources 
DROP CONSTRAINT IF EXISTS income_sources_family_id_fkey,
ADD CONSTRAINT income_sources_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES families(id) 
  ON DELETE CASCADE;