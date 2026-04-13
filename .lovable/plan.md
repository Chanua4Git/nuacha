

## Build a Payroll/NIS Calculation API Edge Function

### What this does
Creates a public API endpoint hosted in Nuacha's Supabase project that your other caregiving app can call to:
1. Check if weekly pay exceeds $200 and determine if NIS applies
2. Look up the correct NIS earnings class from the Trinidad & Tobago lookup table
3. Return employer and employee contribution amounts for inclusion in payslips

### How the other app uses it
Your other app sends a simple HTTP request with the caregiver's weekly earnings (or hours + rate), and gets back the NIS class, employee deduction, and employer deduction. The other app then includes these values in its payslip/receipt generation.

### What gets built

**1. New Edge Function: `supabase/functions/payroll-api/index.ts`**

A single edge function with these endpoints (via request body `action` field):

- **`calculate-nis`** -- The primary endpoint. Accepts weekly earnings (or hourly rate + hours), checks the $200/week threshold, looks up the NIS earnings class table, and returns:
  - Whether NIS applies (weekly pay > $200)
  - NIS earnings class (Class 1-10)
  - Employee contribution amount
  - Employer contribution amount
  - Net pay after employee NIS deduction

- **`get-nis-classes`** -- Returns the full NIS lookup table for reference/display in the other app

Request format example:
```json
{
  "action": "calculate-nis",
  "weekly_earnings": 450,
  "effective_date": "2024-01-01"
}
```
Or with rate + hours:
```json
{
  "action": "calculate-nis",
  "hourly_rate": 50,
  "hours_worked": 40
}
```

Response example:
```json
{
  "nis_applicable": true,
  "weekly_earnings": 450.00,
  "nis_class": "Class 7",
  "employee_contribution": 14.40,
  "employer_contribution": 30.00,
  "gross_pay": 450.00,
  "net_pay_after_nis": 435.60
}
```

If weekly pay is $200 or less:
```json
{
  "nis_applicable": false,
  "weekly_earnings": 180.00,
  "nis_class": null,
  "employee_contribution": 0,
  "employer_contribution": 0,
  "gross_pay": 180.00,
  "net_pay_after_nis": 180.00
}
```

**2. Security**
- CORS headers for cross-origin calls from the other Lovable app
- Input validation with Zod
- No authentication required (public API) -- the NIS rates are public knowledge; no user data is exposed
- Rate limiting can be added later if needed

**3. How to call from the other app**
The other app would call:
```
POST https://fjrxqeyexlusjwzzecal.supabase.co/functions/v1/payroll-api
```
With the JSON body above. No API key needed beyond the anon key in the header.

### Technical details
- One new file: `supabase/functions/payroll-api/index.ts`
- Queries the existing `nis_earnings_classes` table directly using `service_role` key (available in edge functions by default)
- The $200/week threshold logic: if `weekly_earnings <= 200`, return zeroes; otherwise look up the class
- No changes to existing Nuacha code or database schema

### What you do in the other app afterward
In the caregiving app's payroll/payslip flow:
1. When a work log is approved, calculate weekly earnings from hours x rate
2. Call this API with the weekly earnings
3. If `nis_applicable` is true, deduct `employee_contribution` from the caregiver's pay and record `employer_contribution` as the family's liability
4. Include both values on the generated payslip/receipt

