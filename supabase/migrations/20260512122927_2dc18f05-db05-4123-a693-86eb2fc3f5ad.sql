-- Backfill recorded_pay for imported xlsx payroll entries
-- Rule: recorded = gross - nis_employee when gross > 0; else 0. Variance reset to 0.
UPDATE payroll_entries pe
SET recorded_pay = CASE WHEN pe.gross_pay > 0 THEN pe.gross_pay - pe.nis_employee_contribution ELSE 0 END,
    variance_amount = 0,
    net_pay = CASE WHEN pe.gross_pay > 0 THEN pe.gross_pay - pe.nis_employee_contribution - COALESCE(pe.other_deductions, 0) ELSE 0 END,
    updated_at = now()
FROM payroll_periods pp
WHERE pp.id = pe.payroll_period_id
  AND pp.import_source LIKE 'xlsx_import_%';

-- Recompute period totals from entries for affected periods
UPDATE payroll_periods pp
SET total_gross_pay = COALESCE(s.gross, 0),
    total_nis_employee = COALESCE(s.nis_e, 0),
    total_nis_employer = COALESCE(s.nis_r, 0),
    total_net_pay = COALESCE(s.net, 0),
    updated_at = now()
FROM (
  SELECT payroll_period_id,
         SUM(gross_pay) AS gross,
         SUM(nis_employee_contribution) AS nis_e,
         SUM(nis_employer_contribution) AS nis_r,
         SUM(net_pay) AS net
  FROM payroll_entries
  GROUP BY payroll_period_id
) s
WHERE s.payroll_period_id = pp.id
  AND pp.import_source LIKE 'xlsx_import_%';