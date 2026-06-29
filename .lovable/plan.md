## 1. Payslip wording fixes (`src/lib/payslip.ts`)

Restore the opening identity line and switch the label from "Payslip" to "Payment Receipt".

**Single-week message** — new top lines:
```
Payment Receipt — A N-Collymore
June · Week 4
Period: 22 Jun – 28 Jun 2026
```
- Line 1: `Payment Receipt — {first initial}. {last name}` (falls back to full first + last name if no initial available).
- Line 2: `{Month name of week_start_date} · Week {week_number}` (omit "Week N" gracefully if missing).
- Line 3: existing period range.

**Multi-week message** — new top lines:
```
Payment Receipt — A N-Collymore
Period: 1 Jun – 28 Jun 2026
```
Per-week rows stay as-is.

Footer stays `Sent via Nuacha` (or `From {trade name}` when set).

## 2. NIS remittance tracking on the monthly subtotal row

Goal: each month's Total NIS line gets its own "paid to NIB" log — paid-on date, NIB transaction/reference code, and a "NI 184 submitted" checkbox. Mirrors the weekly Paid-on flow.

### New table `public.nis_remittances`
Per user + employee + month:
- `user_id`, `employee_id`, `period_month` (date, first of month)
- `total_nis` (numeric — snapshot at time of save)
- `paid_on_date` (date, nullable)
- `nib_transaction_code` (text, nullable)
- `ni184_submitted` (bool, default false)
- `ni184_submitted_at` (timestamptz, nullable)
- `notes` (text, nullable)
- standard `id`, `created_at`, `updated_at`
- Unique on (`user_id`, `employee_id`, `period_month`)
- RLS scoped to `auth.uid() = user_id`, with required GRANTs.

### UI changes (`PayrollLog.tsx`)
Replace the empty `colSpan={3}` cell at the end of the Subtotal row with a compact inline editor:
- Date input → Paid on (to NIB)
- Text input → Transaction code
- Checkbox → NI 184 submitted
- Auto-saves on blur/toggle (same pattern as `PaidOnCell`), shows a small green check when saved.

A new `NisRemittanceCell` component handles fetch/upsert against `nis_remittances` keyed by employee + month.

### New hook `useNisRemittance(employeeId, periodMonth)`
Loads/saves a single remittance row, exposes `{ data, save(patch) }`.

## Out of scope
- PDF receipts, editing already-saved payslip records, changing the weekly Paid-on column, bulk NIS export.

## Technical notes
- `formatPayslipText` will receive `employee.first_name` + `employee.last_name`; initial is built as `first_name?.[0]?.toUpperCase()`.
- Month name uses `toLocaleDateString('en-GB', { month: 'long' })` from `week_start_date`.
- Subtotal cell currently spans 3 columns (Entry date, Paid on, action). The new editor will occupy those 3 cells as a single flex row so column alignment below isn't disturbed.
