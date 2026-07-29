# Rebuild A N-Collymore payroll from June 2022 to date

## What's wrong today

Checked the stored rows against `Angela_Salary_Study_1.xlsx` (the payroll tabs). Three separate problems:

1. **Duplicate weeks in 2023.** The workbook tabs "Jan 2024" through "June 2024" and "Jan 2025" carry the *previous year's* dates by mistake (e.g. the June 2024 tab lists week starts 2023-06-03 … 2023-06-24, which are Saturdays, not the Mondays the rest of the file uses). Those rows were imported literally, so the log's June 2023 month now shows 8 rows: the 4 genuine June 2023 weeks (from the "July 2023" tab) plus 4 mistyped copies.
2. **Missing months.** Tabs whose header row doesn't say "Week start" (the 2022-style layout: Oct 2022, Nov 2022, Dec 2022, Jan 2023) are skipped by the importer. October 2022 has 1 stored row instead of 5, November 2022 has 1, and December 2022 / January 2023 have none. A bogus "July 2022" period with 2 rows also exists, created from misread October 2022 dates.
3. **Wrong dates and blank pay day.** In the 2022 tabs Excel stored ambiguous day/month values swapped (3/10/2022 became 3 March, 4/11/2022 became 4 April). And no month from Oct 2022 onward has a per-week pay day stored, so the log and PDF fall back to the period's month-end date (that's the 2023-07-31 / 2024-06-30 you see in the Pay day column) instead of the Friday in column C.

Also worth flagging: the workbook has **no tabs at all for May, June, July, August or September 2022** — the legacy CSV stops at 22 April 2022 and the next tab is October 2022. Those months can't be rebuilt without source data; I'll leave the gap and note it, unless you can supply a sheet for them.

## The fix

### 1. One-time data rebuild (June 2022 → today)

Delete A N-Collymore's imported entries with a week start on/after 2022-06-01 and re-insert them from the workbook using these normalisation rules:

- **Week start must be a Monday**, week end = start + 6 days, pay day = the Friday in column C (start + 4 when column C is unusable). Any Excel day/month swap that doesn't land on a Monday is corrected by trying the swapped reading.
- **Year correction**: when a tab's rows fall a full year before the tab's own month (Jan–Jun 2024 tabs, Jan 2025 tab), the year is bumped to the tab's year — confirmed by the weekday check.
- **Deduplicate by week start**, keeping the corrected copy where a week appears twice (the Dec 2023 tab re-states corrected November 2023 weeks; the Nov 2022 tab is an unmodified copy of Oct 2022 and is discarded).
- Per week store: days worked, calculated pay, NIS employee, NIS employer, total NIS, recorded pay, pay day, week start/end. NIS values come from the sheet and are cross-checked against the 2016 T&T schedule (pre-2026 weeks).
- Each week is filed into the payroll period matching its **week-start month**, so the log headings match reality; period totals (gross, NIS employee, NIS employer, net) are recomputed afterwards.
- Payment method stays on the existing rule (cash up to 24 Apr 2026, bank transfer after) and any method you've overridden by hand is preserved.

### 2. Importer hardening

So a future re-import doesn't reintroduce the same mess, `PayrollLogImporter.tsx` gets the same rules:

- support the 2022-style tab layout that has no "Week start" header row;
- Monday/Friday/Sunday anchoring for week start, pay day and week end, including day/month swap recovery;
- correct rows whose year is one behind the tab's year;
- de-duplicate weeks across tabs before writing;
- always write `pay_day_date` from the sheet's pay-day column;
- drop the current 6-rows-per-tab cap.

### 3. Verification

After the rebuild I'll list every month from June 2022 to date with its week count, week start/end, pay day and totals, and check June 2023 shows exactly 4 weeks (03-06 → 26-06 starts on Mondays 05, 12, 19, 26 June) with pay days 09/16/23/30 June.

## Technical notes

- Data changes run as SQL through the database tools (delete + insert + period total recalculation), scoped to employee `f4b0e742-…` and week starts ≥ 2022-06-01. No other employee or earlier period is touched.
- Code change is limited to `src/components/payroll/PayrollLogImporter.tsx`; the log, PDF and CSV already read `pay_day_date` first, so they pick up the corrected values with no further change.
