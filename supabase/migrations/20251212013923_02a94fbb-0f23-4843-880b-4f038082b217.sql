-- Create employee_shifts table for flexible shift-based pay
CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  shift_hours TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can manage shifts for their own employees
CREATE POLICY "Users can manage their own employee shifts"
ON public.employee_shifts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_shifts.employee_id
    AND e.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_employee_shifts_employee_id ON public.employee_shifts(employee_id);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_shifts_updated_at
BEFORE UPDATE ON public.employee_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();