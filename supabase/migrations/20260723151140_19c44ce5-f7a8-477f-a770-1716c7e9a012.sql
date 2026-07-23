-- 1) Fix week_end_date rows where month/day was flipped on legacy import.
-- Rule: week_end must be within [week_start, week_start + 13 days]; otherwise
-- reset to week_start + 4 days (standard Mon-Fri work week).
UPDATE public.payroll_entries
SET week_end_date = (week_start_date + INTERVAL '4 days')::date
WHERE week_start_date IS NOT NULL
  AND (
    week_end_date IS NULL
    OR week_end_date < week_start_date
    OR week_end_date > (week_start_date + INTERVAL '13 days')::date
  );

-- 2) Fix payroll_periods.pay_date when it falls outside the period window.
UPDATE public.payroll_periods
SET pay_date = end_date
WHERE end_date IS NOT NULL
  AND (
    pay_date IS NULL
    OR pay_date < start_date
    OR pay_date > (end_date + INTERVAL '30 days')::date
  );

-- 3) Deduplicate legacy import: keep the earliest row per (employee, week_start, period).
DELETE FROM public.payroll_entries a
USING public.payroll_entries b
WHERE a.employee_id = b.employee_id
  AND a.payroll_period_id = b.payroll_period_id
  AND a.week_start_date IS NOT NULL
  AND a.week_start_date = b.week_start_date
  AND a.ctid > b.ctid;

-- 4) Recompute period totals after dedupe.
UPDATE public.payroll_periods p
SET total_gross_pay = COALESCE(t.g, 0),
    total_nis_employee = COALESCE(t.ee, 0),
    total_nis_employer = COALESCE(t.er, 0),
    total_net_pay = COALESCE(t.n, 0)
FROM (
  SELECT payroll_period_id,
         SUM(gross_pay) g,
         SUM(nis_employee_contribution) ee,
         SUM(nis_employer_contribution) er,
         SUM(net_pay) n
  FROM public.payroll_entries
  GROUP BY payroll_period_id
) t
WHERE p.id = t.payroll_period_id;