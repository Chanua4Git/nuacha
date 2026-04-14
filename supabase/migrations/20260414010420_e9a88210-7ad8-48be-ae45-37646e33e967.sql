
-- Add date_of_birth to employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Create employer_settings table
CREATE TABLE IF NOT EXISTS public.employer_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trade_name text,
  employer_reg_no text,
  service_centre_code text,
  address text,
  telephone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.employer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own employer settings"
ON public.employer_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_settings TO authenticated;

-- Add NI 187 fields to payroll_periods
ALTER TABLE public.payroll_periods
ADD COLUMN IF NOT EXISTS nis_balance_bf numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS nis_penalty numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS nis_interest numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS nis_payment_method text DEFAULT 'cheque';

-- Trigger for updated_at on employer_settings
CREATE OR REPLACE TRIGGER update_employer_settings_updated_at
BEFORE UPDATE ON public.employer_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
