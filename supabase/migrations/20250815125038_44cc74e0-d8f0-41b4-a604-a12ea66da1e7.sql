-- Step 1: Clean up duplicate SAHM families
-- First, migrate expenses from the empty SAHM family to the active one
UPDATE expenses 
SET family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d'
WHERE family_id = 'd9ce96a3-b307-49e7-86a9-5287c83c1e4f';

-- Migrate any other data (family_members, reminders, etc.)
UPDATE family_members 
SET family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d'
WHERE family_id = 'd9ce96a3-b307-49e7-86a9-5287c83c1e4f';

UPDATE reminders 
SET family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d'
WHERE family_id = 'd9ce96a3-b307-49e7-86a9-5287c83c1e4f';

UPDATE categories 
SET family_id = '75a5782d-5540-4ff4-a3dc-8a08e687871d'
WHERE family_id = 'd9ce96a3-b307-49e7-86a9-5287c83c1e4f';

-- Delete the empty duplicate SAHM family
DELETE FROM families 
WHERE id = 'd9ce96a3-b307-49e7-86a9-5287c83c1e4f';

-- Step 2: Add constraint to prevent duplicate family names per user
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_family_name_per_user 
ON families(user_id, LOWER(name));

-- Step 3: Create function to clean up any other duplicate families
CREATE OR REPLACE FUNCTION clean_duplicate_families()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    duplicate_rec RECORD;
    keep_family_id UUID;
BEGIN
    -- Find and clean up any other duplicate families by name per user
    FOR duplicate_rec IN
        SELECT user_id, LOWER(name) as name_lower, array_agg(id ORDER BY created_at) as family_ids
        FROM families 
        GROUP BY user_id, LOWER(name)
        HAVING count(*) > 1
    LOOP
        -- Keep the first (oldest) family
        keep_family_id := duplicate_rec.family_ids[1];
        
        -- Migrate all data from duplicate families to the kept one
        FOR i IN 2..array_length(duplicate_rec.family_ids, 1) LOOP
            -- Migrate expenses
            UPDATE expenses SET family_id = keep_family_id 
            WHERE family_id = duplicate_rec.family_ids[i];
            
            -- Migrate family members
            UPDATE family_members SET family_id = keep_family_id 
            WHERE family_id = duplicate_rec.family_ids[i];
            
            -- Migrate reminders
            UPDATE reminders SET family_id = keep_family_id 
            WHERE family_id = duplicate_rec.family_ids[i];
            
            -- Migrate categories
            UPDATE categories SET family_id = keep_family_id 
            WHERE family_id = duplicate_rec.family_ids[i];
            
            -- Delete the duplicate family
            DELETE FROM families WHERE id = duplicate_rec.family_ids[i];
        END LOOP;
    END LOOP;
END;
$$;

-- Run the cleanup function
SELECT clean_duplicate_families();