-- Ensure self-referential parent_id uses ON DELETE CASCADE so deleting a parent also removes its subtree
DO $$
BEGIN
  -- Drop existing FK if it exists (name is typically this by convention)
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'categories' AND c.conname = 'categories_parent_id_fkey'
  ) THEN
    ALTER TABLE public.categories DROP CONSTRAINT categories_parent_id_fkey;
  END IF;

  -- Recreate FK with ON DELETE CASCADE
  ALTER TABLE public.categories
  ADD CONSTRAINT categories_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.categories(id)
  ON DELETE CASCADE;
END $$;