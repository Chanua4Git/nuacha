
-- Deactivate old 2024 classes
UPDATE public.nis_earnings_classes SET is_active = false WHERE effective_date = '2024-01-01';

-- Insert 2026 NIS earnings classes (effective 05 January 2026)
INSERT INTO public.nis_earnings_classes (effective_date, earnings_class, min_weekly_earnings, max_weekly_earnings, employee_contribution, employer_contribution, is_active) VALUES
('2026-01-05', 'Class I',    200.00,   339.99,  14.60,  29.20, true),
('2026-01-05', 'Class II',   340.00,   449.99,  21.30,  42.60, true),
('2026-01-05', 'Class III',  450.00,   609.99,  28.60,  57.20, true),
('2026-01-05', 'Class IV',   610.00,   759.99,  37.00,  74.00, true),
('2026-01-05', 'Class V',    760.00,   929.99,  45.60,  91.20, true),
('2026-01-05', 'Class VI',   930.00,  1119.99,  55.40, 110.80, true),
('2026-01-05', 'Class VII', 1120.00,  1299.99,  65.30, 130.60, true),
('2026-01-05', 'Class VIII',1300.00,  1489.99,  75.30, 150.60, true),
('2026-01-05', 'Class IX',  1490.00,  1709.99,  86.40, 172.80, true),
('2026-01-05', 'Class X',   1710.00,  1909.99,  97.70, 195.40, true),
('2026-01-05', 'Class XI',  1910.00,  2139.99, 109.40, 218.80, true),
('2026-01-05', 'Class XII', 2140.00,  2379.99, 122.00, 244.00, true),
('2026-01-05', 'Class XIII',2380.00,  2629.99, 135.30, 270.60, true),
('2026-01-05', 'Class XIV', 2630.00,  2919.99, 149.90, 299.80, true),
('2026-01-05', 'Class XV',  2920.00,  3137.99, 163.60, 327.20, true),
('2026-01-05', 'Class XVI', 3138.00, 99999.99, 169.50, 339.00, true);
