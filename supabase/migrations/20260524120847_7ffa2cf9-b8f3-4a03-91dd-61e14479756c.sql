ALTER TABLE public.payroll_entries
  DROP CONSTRAINT IF EXISTS payroll_entries_period_emp_week_key;

DROP INDEX IF EXISTS public.payroll_entries_period_employee_week_uidx;

WITH ranked AS (
  SELECT
    pe.id,
    ROW_NUMBER() OVER (
      PARTITION BY pe.employee_id, pp.user_id, date_trunc('month', pp.start_date), pe.week_start_date
      ORDER BY (COALESCE(pe.gross_pay, 0) + COALESCE(pe.recorded_pay, 0)) DESC, pe.updated_at DESC, pe.created_at DESC
    ) AS rn
  FROM public.payroll_entries pe
  JOIN public.payroll_periods pp ON pp.id = pe.payroll_period_id
  WHERE pe.week_start_date IS NOT NULL
)
DELETE FROM public.payroll_entries
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

WITH month_periods AS (
  SELECT
    pp.user_id,
    date_trunc('month', pp.start_date)::date AS month_bucket,
    (ARRAY_AGG(pp.id ORDER BY pp.created_at ASC, pp.start_date ASC))[1] AS canonical_period_id
  FROM public.payroll_periods pp
  GROUP BY pp.user_id, date_trunc('month', pp.start_date)
)
UPDATE public.payroll_entries pe
SET payroll_period_id = mp.canonical_period_id
FROM public.payroll_periods pp
JOIN month_periods mp
  ON pp.user_id = mp.user_id
 AND date_trunc('month', pp.start_date)::date = mp.month_bucket
WHERE pe.payroll_period_id = pp.id
  AND pe.payroll_period_id <> mp.canonical_period_id;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY payroll_period_id, employee_id, week_start_date
      ORDER BY (COALESCE(gross_pay, 0) + COALESCE(recorded_pay, 0)) DESC, updated_at DESC, created_at DESC
    ) AS rn
  FROM public.payroll_entries
  WHERE week_start_date IS NOT NULL
)
DELETE FROM public.payroll_entries
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

UPDATE public.payroll_entries pe
SET week_number = sub.week_number
FROM (
  SELECT
    id,
    (FLOOR((EXTRACT(DAY FROM week_start_date) - 1) / 7) + 1)::integer AS week_number
  FROM public.payroll_entries
  WHERE week_start_date IS NOT NULL
) sub
WHERE pe.id = sub.id;

CREATE UNIQUE INDEX IF NOT EXISTS payroll_entries_period_employee_week_start_key
  ON public.payroll_entries (payroll_period_id, employee_id, week_start_date)
  WHERE week_start_date IS NOT NULL;