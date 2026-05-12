
-- 1. Insert the September 5, 2016 NIS earnings classes (13.2% schedule)
INSERT INTO public.nis_earnings_classes (effective_date, earnings_class, min_weekly_earnings, max_weekly_earnings, employee_contribution, employer_contribution, is_active) VALUES
 ('2016-09-05','Class I',    200.00,  339.99,  11.90,  23.80, true),
 ('2016-09-05','Class II',   340.00,  449.99,  17.40,  34.80, true),
 ('2016-09-05','Class III',  450.00,  609.99,  23.30,  46.60, true),
 ('2016-09-05','Class IV',   610.00,  759.99,  30.10,  60.20, true),
 ('2016-09-05','Class V',    760.00,  929.99,  37.20,  74.40, true),
 ('2016-09-05','Class VI',   930.00, 1119.99,  45.10,  90.20, true),
 ('2016-09-05','Class VII', 1120.00, 1299.99,  53.20, 106.40, true),
 ('2016-09-05','Class VIII',1300.00, 1489.99,  61.40, 122.80, true),
 ('2016-09-05','Class IX',  1490.00, 1709.99,  70.40, 140.80, true),
 ('2016-09-05','Class X',   1710.00, 1909.99,  79.60, 159.20, true),
 ('2016-09-05','Class XI',  1910.00, 2139.99,  89.10, 178.20, true),
 ('2016-09-05','Class XII', 2140.00, 2379.99,  99.40, 198.80, true),
 ('2016-09-05','Class XIII',2380.00, 2629.99, 110.20, 220.40, true),
 ('2016-09-05','Class XIV', 2630.00, 2919.99, 122.10, 244.20, true),
 ('2016-09-05','Class XV',  2920.00, 3137.99, 133.10, 266.20, true),
 ('2016-09-05','Class XVI', 3138.00, 99999.99,138.20, 276.40, true);

-- 2. Back-fill payroll_entries where NIS is 0 for periods before the 2026-01-05 schedule
WITH candidates AS (
  SELECT pe.id AS entry_id,
         pe.gross_pay,
         COALESCE(pe.other_deductions, 0) AS other_deductions,
         pp.start_date
    FROM public.payroll_entries pe
    JOIN public.payroll_periods pp ON pp.id = pe.payroll_period_id
   WHERE pp.start_date < '2026-01-05'
     AND pe.nis_employee_contribution = 0
     AND pe.nis_employer_contribution = 0
     AND pe.gross_pay > 0
),
matched AS (
  SELECT c.entry_id,
         c.gross_pay,
         c.other_deductions,
         nec.employee_contribution AS emp,
         nec.employer_contribution AS empr
    FROM candidates c
    JOIN LATERAL (
      SELECT employee_contribution, employer_contribution
        FROM public.nis_earnings_classes n
       WHERE n.is_active
         AND n.effective_date <= c.start_date
         AND c.gross_pay >= n.min_weekly_earnings
         AND c.gross_pay <= n.max_weekly_earnings
       ORDER BY n.effective_date DESC
       LIMIT 1
    ) nec ON true
)
UPDATE public.payroll_entries pe
   SET nis_employee_contribution = m.emp,
       nis_employer_contribution = m.empr,
       net_pay = pe.gross_pay - m.emp - COALESCE(pe.other_deductions, 0),
       updated_at = now()
  FROM matched m
 WHERE pe.id = m.entry_id;

-- 3. Recompute payroll_periods totals
UPDATE public.payroll_periods pp
   SET total_nis_employee = COALESCE(s.emp_sum, 0),
       total_nis_employer = COALESCE(s.empr_sum, 0),
       total_net_pay      = COALESCE(s.net_sum, 0),
       total_gross_pay    = COALESCE(s.gross_sum, pp.total_gross_pay),
       updated_at = now()
  FROM (
    SELECT payroll_period_id,
           SUM(nis_employee_contribution) AS emp_sum,
           SUM(nis_employer_contribution) AS empr_sum,
           SUM(net_pay) AS net_sum,
           SUM(gross_pay) AS gross_sum
      FROM public.payroll_entries
     GROUP BY payroll_period_id
  ) s
 WHERE pp.id = s.payroll_period_id
   AND pp.start_date < '2026-01-05';
