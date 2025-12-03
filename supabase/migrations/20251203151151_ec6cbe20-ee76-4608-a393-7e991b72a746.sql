-- Create learning module status table
CREATE TABLE IF NOT EXISTS learning_module_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'coming-soon')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE learning_module_status ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see module statuses)
CREATE POLICY "Public read access" ON learning_module_status 
  FOR SELECT TO public USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can manage module status" ON learning_module_status 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);