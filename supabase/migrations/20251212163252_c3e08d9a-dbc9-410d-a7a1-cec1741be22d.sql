-- Fix Tricia's Night Shift base_rate from 249.98 to 250.00
UPDATE employee_shifts 
SET base_rate = 250.00 
WHERE id = '84fb4805-a062-4d67-b79f-1e4392e0e5cc';