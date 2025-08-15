-- Fix the security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION clean_duplicate_families()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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