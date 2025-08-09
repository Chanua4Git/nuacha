-- Add new fields to payroll_periods table for enhanced tracking
ALTER TABLE payroll_periods 
ADD COLUMN IF NOT EXISTS entered_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS paid_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS transaction_id text,
ADD COLUMN IF NOT EXISTS payroll_data jsonb,
ADD COLUMN IF NOT EXISTS notes text;

-- Add new fields to payroll_entries table for weekly data storage
ALTER TABLE payroll_entries
ADD COLUMN IF NOT EXISTS week_number integer,
ADD COLUMN IF NOT EXISTS week_start_date date,
ADD COLUMN IF NOT EXISTS week_end_date date,
ADD COLUMN IF NOT EXISTS recorded_pay numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS variance_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS variance_notes text;

-- Create index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_payroll_periods_employee_date ON payroll_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_period_week ON payroll_entries(payroll_period_id, week_number);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_transaction_id ON payroll_periods(transaction_id) WHERE transaction_id IS NOT NULL;

-- Create function to update payroll period totals
CREATE OR REPLACE FUNCTION update_payroll_period_totals(period_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE payroll_periods 
  SET 
    total_gross_pay = (
      SELECT COALESCE(SUM(gross_pay), 0) 
      FROM payroll_entries 
      WHERE payroll_period_id = period_id
    ),
    total_nis_employee = (
      SELECT COALESCE(SUM(nis_employee_contribution), 0) 
      FROM payroll_entries 
      WHERE payroll_period_id = period_id
    ),
    total_nis_employer = (
      SELECT COALESCE(SUM(nis_employer_contribution), 0) 
      FROM payroll_entries 
      WHERE payroll_period_id = period_id
    ),
    total_net_pay = (
      SELECT COALESCE(SUM(net_pay), 0) 
      FROM payroll_entries 
      WHERE payroll_period_id = period_id
    ),
    updated_at = now()
  WHERE id = period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;