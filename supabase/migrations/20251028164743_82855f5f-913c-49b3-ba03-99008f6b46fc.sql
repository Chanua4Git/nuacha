-- Add Google Drive columns to expenses table
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_url TEXT,
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

-- Add index for Drive lookups
CREATE INDEX IF NOT EXISTS idx_expenses_drive_file_id 
  ON public.expenses(drive_file_id) 
  WHERE drive_file_id IS NOT NULL;

-- Add Drive settings to families table
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_shared_emails TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN expenses.drive_file_id IS 'Google Drive file ID for the receipt';
COMMENT ON COLUMN expenses.drive_url IS 'Shareable Google Drive URL for the receipt';
COMMENT ON COLUMN families.drive_folder_id IS 'Google Drive folder ID for this family';
COMMENT ON COLUMN families.drive_shared_emails IS 'Email addresses with access to family Drive folder';