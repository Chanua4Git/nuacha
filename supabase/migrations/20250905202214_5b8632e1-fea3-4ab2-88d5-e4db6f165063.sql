-- Add whatsapp_number field to demo_leads table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demo_leads' 
    AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE public.demo_leads ADD COLUMN whatsapp_number text;
  END IF;
END $$;