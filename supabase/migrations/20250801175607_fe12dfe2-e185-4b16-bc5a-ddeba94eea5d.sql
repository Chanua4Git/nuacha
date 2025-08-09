-- Add lead capture data to demo_leads table for payroll leads
ALTER TABLE demo_leads ADD COLUMN business_type text;
ALTER TABLE demo_leads ADD COLUMN employee_count text;
ALTER TABLE demo_leads ADD COLUMN current_payroll_method text;