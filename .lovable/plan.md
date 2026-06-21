# Payslip copy tweaks + history

## 1. Copy tweaks (PayslipDialog text)

In `src/lib/payslip.ts`:
- Remove the opening `🧾 Payslip — {name}` line for both single-week and multi-week.
- Change footer `Sent via Nuacha Payroll` → `Sent via Nuacha`.
- Keep employer line (`From {trade_name}`) unchanged when set.

New single-week message:
```
Period: 15 Jun 2026 – 21 Jun 2026
Week 3

Regular days: 4 × $250.00 = $1,000.00
Holiday days: 1 × $250.00 × 1.5x = $375.00
─────────────
Gross pay: $1,375.00
NIS (employee): -$57.40
─────────────
Net pay: $1,317.60

From Garden Ohm
Sent via Nuacha
```

## 2. Payslip history (saves on Send)

### Database
New table `public.payslips`:
- `user_id` (auth.uid), `employee_id`, `phone_sent_to`
- `period_start`, `period_end` (dates)
- `entry_ids` (uuid[]) — the `payroll_entries` rows it covered
- `gross_total`, `nis_employee_total`, `net_total` (numeric, denormalised so history stays correct even if an entry is later edited)
- `payslip_text` (text — the exact body that was sent)
- `sent_at` (timestamptz)
- standard `created_at` / `updated_at`

RLS: user can CRUD only their own rows. GRANTs to `authenticated` + `service_role`.

### Save trigger
When user clicks **Send via WhatsApp** in `PayslipDialog`:
1. Insert the row (with computed totals + the text we already display).
2. Open the `wa.me` URL (existing behaviour).
3. Toast: "Payslip saved & opened in WhatsApp."

Copy-text and dialog-close do **not** save (per your choice).

### New "Payslips" sub-tab on Payroll page
New component `PayslipHistory.tsx` listing saved payslips:
- Filters: employee dropdown, date range (same presets as the Log).
- Table columns: Employee · Period · Days · Gross · NIS · Net · Sent on · Phone · Actions
- Per-row actions:
  - **View** → opens read-only dialog showing the saved text
  - **Re-send** → opens WhatsApp with the saved text + saved phone
  - **Copy**
  - **Delete** (with confirm)
- Empty state in Nuacha tone: "No payslips sent yet — when you send one, it'll be kept here."

Added as a new tab on the existing Payroll page tabs (alongside Calculator / Log / etc.).

### Files
- New migration: `payslips` table + RLS + GRANTs.
- `src/lib/payslip.ts` — copy tweaks.
- `src/components/payroll/PayslipDialog.tsx` — insert into `payslips` on Send, with totals + text.
- New `src/hooks/usePayslipHistory.ts` — list/refresh saved payslips.
- New `src/components/payroll/PayslipHistory.tsx` — UI for the tab.
- Payroll page (`src/pages/Payroll.tsx` or wherever tabs live) — add "Payslips" tab.

## Out of scope
- PDF payslips (text only for now).
- Editing a saved payslip (delete + regenerate instead).
- Auto-saving on copy or on open (only on Send, per your choice).
- Fixing missing June Week 1 (still pending — say the word and I'll investigate).
