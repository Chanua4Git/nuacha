DO $$
DECLARE
  src_id uuid := 'f4b0e742-4c42-4978-9fcf-5dda560b3939';
  new_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.employees (
    id, user_id, employee_number, first_name, last_name,
    email, phone, national_id, employment_type,
    hourly_rate, monthly_salary, daily_rate, weekly_rate,
    nis_number, is_active, date_hired, date_terminated,
    date_of_birth, weekly_pay_schedule, created_at, updated_at
  )
  SELECT
    new_id, user_id, 'EMP007', 'Suzette', 'Paul',
    NULL, NULL, NULL, employment_type,
    hourly_rate, monthly_salary, daily_rate, weekly_rate,
    NULL, is_active, date_hired, date_terminated,
    date_of_birth, weekly_pay_schedule, now(), now()
  FROM public.employees WHERE id = src_id;

  INSERT INTO public.payroll_entries (
    id, payroll_period_id, employee_id, hours_worked, days_worked,
    gross_pay, nis_employee_contribution, nis_employer_contribution,
    other_deductions, other_allowances, net_pay, calculated_at,
    created_at, updated_at, week_number, week_start_date, week_end_date,
    recorded_pay, variance_amount, variance_notes, entry_date, paid_on_date
  )
  SELECT
    gen_random_uuid(), payroll_period_id, new_id, hours_worked, days_worked,
    gross_pay, nis_employee_contribution, nis_employer_contribution,
    other_deductions, other_allowances, net_pay, calculated_at,
    now(), now(), week_number, week_start_date, week_end_date,
    recorded_pay, variance_amount, variance_notes, entry_date, paid_on_date
  FROM public.payroll_entries WHERE employee_id = src_id;
END $$;